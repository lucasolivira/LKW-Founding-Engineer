import { gemini, GEMINI_MODEL } from './gemini';
import type { ExtractApiResponse, ExtractedQuotationData } from './types';

const TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `Você é um assistente especializado em extrair dados estruturados de pedidos de cotação de frete recebidos por WhatsApp/email pela transportadora Verdebrasil.

CONTEXTO DAS MENSAGENS:
- Português brasileiro INFORMAL, com erros de digitação e abreviações
- Vocabulário comum: "t"/"ton" = toneladas, "kg" = quilos, "m3"/"m³" = metros cúbicos, "cx" = caixa, "plt" = pallet
- Gírias de logística: "cavalo"/"cavalinho" = cavalo mecânico (geralmente carreta), "baú" = veículo fechado, "prancha" = carreta para máquinas
- O cliente pode chamar a operadora pelo nome (Marília); ignore saudações
- Pode haver várias cargas em uma só mensagem — extraia a primeira carga descrita

CAMPOS A EXTRAIR (responda com JSON contendo EXATAMENTE estas chaves):
1. "origemCidade" (string|null)
2. "origemEstado" (string|null) — sigla UF de 2 letras maiúsculas (ex: "GO", "SP")
3. "destinoCidade" (string|null)
4. "destinoEstado" (string|null) — sigla UF de 2 letras maiúsculas
5. "tipoCarga" (string|null) — APENAS um destes: "seca" | "refrigerada" | "fracionada" | "perigosa"
   - "seca": grãos, fertilizantes, materiais, bebida em temperatura ambiente
   - "refrigerada": exige cadeia de frio (carnes, congelados, vacinas)
   - "fracionada": múltiplos volumes pequenos, LTL
   - "perigosa": químicos, inflamáveis, classes ANTT
6. "pesoToneladas" (number|null) — sempre em toneladas. Converta kg para t (12000 kg = 12). "aprox 14t" → 14
7. "volumeM3" (number|null) — em metros cúbicos
8. "tipoVeiculo" (string|null) — APENAS um destes: "toco" | "truck" | "carreta" | "bitrem"
9. "prazoColeta" (string|null) — descrição literal do cliente, NÃO converta para data ISO (ex: "amanhã", "segunda 06h", "esta semana")
10. "prazoEntrega" (string|null) — descrição literal
11. "restricoes" (array de strings | null) — ex: ["escolta armada", "agendamento prévio", "entrega após 18h"]. Use null (NÃO array vazio) se nada foi mencionado
12. "urgente" (boolean) — true SOMENTE se há marcadores explícitos: "urgente", "para hoje", "sem falta", "preciso já", "imediato"
13. "confianca" (object) — para cada campo acima, score 0.0-1.0:
    - 1.0 = explícito (cliente disse exatamente)
    - 0.8 = inferência forte (ex: "fertilizante" → tipoCarga "seca"; "Anápolis" → origemEstado "GO")
    - 0.5 = inferência fraca/ambígua
    - 0.0 = campo é null (não mencionado nem inferível)
    Chaves: origemCidade, origemEstado, destinoCidade, destinoEstado, tipoCarga, pesoToneladas, volumeM3, tipoVeiculo, prazoColeta, prazoEntrega, restricoes, urgente

REGRAS CRÍTICAS:
- NÃO INVENTE. Se o cliente não disse e você não pode inferir com base contextual razoável, use null.
- "interior de SP" / "região de X" → destinoCidade = null, destinoEstado = "SP" (regional, sem cidade específica).
- Negações importam: "preciso refrigerado? Não, temperatura ambiente serve" → tipoCarga = "seca".
- "cavalinho" e "cavalo" SEM mais contexto → tipoVeiculo = "carreta" (com confianca ~0.6).
- Datas: mantenha a expressão LITERAL do cliente; nunca normalize para ISO.
- urgente: false por padrão. Apenas true se houver palavra de urgência explícita.

Responda APENAS com o JSON. Sem markdown, sem texto antes ou depois.`;

interface GeminiUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export type ExtractionErrorKind =
  | 'TIMEOUT'
  | 'INVALID_JSON'
  | 'EMPTY_RESPONSE'
  | 'API_ERROR';

export class ExtractionError extends Error {
  constructor(
    public readonly kind: ExtractionErrorKind,
    message: string,
    public readonly raw?: string
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

class TimeoutError extends Error {
  constructor() {
    super('TIMEOUT');
    this.name = 'TimeoutError';
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new TimeoutError()), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export async function runExtraction(
  message: string
): Promise<ExtractApiResponse> {
  const startedAt = Date.now();

  let response; // trocar para const
  try {
    response = await withTimeout(
      gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: message,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0,
        },
      }),
      TIMEOUT_MS
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      throw new ExtractionError(
        'TIMEOUT',
        `Timeout (${TIMEOUT_MS}ms) ao chamar o LLM`
      );
    }
    const details =
      error instanceof Error ? error.message : 'Erro desconhecido';
    throw new ExtractionError('API_ERROR', details);
  }

  const text = response.text ?? '';
  if (!text.trim()) {
    throw new ExtractionError('EMPTY_RESPONSE', 'Resposta vazia do LLM');
  }

  let extracted: ExtractedQuotationData;
  try {
    extracted = JSON.parse(text) as ExtractedQuotationData;
  } catch {
    throw new ExtractionError(
      'INVALID_JSON',
      'Resposta do LLM não é JSON válido',
      text
    );
  }

  const usage = response.usageMetadata as GeminiUsage | undefined;
  return {
    extracted,
    usage: {
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      totalTokens: usage?.totalTokenCount ?? 0,
    },
    processingTimeMs: Date.now() - startedAt,
  };
}

export const EXTRACTION_TIMEOUT_MS = TIMEOUT_MS;
