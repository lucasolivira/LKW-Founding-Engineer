# LKW · Founding Engineer · Cotação Verdebrasil

## Link do repositório: https://github.com/lucasolivira/LKW-Founding-Engineer

## Como rodar

Pré-requisitos: Node 20+

```bash
# 1) instalar (gera Prisma Client via postinstall)
npm install

# 2) configurar .env na raiz
echo 'DATABASE_URL="file:./dev.db"' > .env
echo 'AI_API_KEY="AIzaSyBEO1IjH_4IyLRcDuZaaAIOstWHQZEOZTs"' >> .env ou
echo 'AI_API_KEY="AIzaSyB2lKHkuiiWVWS1WtdqHeH9a14m6qWPzYY"' >> .env

# 3) criar o banco SQLite
npx prisma migrate dev --name init

# 4) subir
npm run dev
```

Aplicação em [http://localhost:3000](http://localhost:3000).

---

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Prisma** + **SQLite** (arquivo local em `prisma/dev.db`)
- **Gemini 2.5 Flash** via `@google/genai` para extração estruturada (JSON mode, `temperature: 0`)
- **Tailwind** + componentes estilo shadcn/ui

---

## O que está implementado

- **UI mínima** ([src/app/page.tsx](src/app/page.tsx)): textarea pra colar a mensagem, botão de cotar, painel de resultado, sidebar de histórico paginado.
- **Extração via LLM** ([src/lib/extraction.ts](src/lib/extraction.ts)): prompt com glossário de logística pt-BR, schema fixo, `responseMimeType: application/json`, `temperature: 0`, timeout de 30s, tipagem de erros (`TIMEOUT` / `INVALID_JSON` / `EMPTY_RESPONSE` / `API_ERROR`).
- **Score de confiança por campo** retornado pelo modelo (0.0–1.0), exibido como badge ao lado de cada dado extraído ([src/components/ConfidenceBadge.tsx](src/components/ConfidenceBadge.tsx)).
- **Cálculo determinístico** ([src/lib/pricing.ts](src/lib/pricing.ts)): tarifa base × peso + adicional de ponta de rota (15%) + pedágio estimado por faixa de km. Inferência de tipo de veículo pelo peso quando o cliente não diz. Lista detalhada de cada passo do cálculo (mostrada no `<details>` do resultado).
- **Planilha-mestre** mockada como JSON ([src/data/tariffs.json](src/data/tariffs.json), [src/data/cities.json](src/data/cities.json), [src/data/toll-estimates.json](src/data/toll-estimates.json)) com loader tipado ([src/lib/data-loader.ts](src/lib/data-loader.ts)).
- **Regra de ponta de rota** baseada em `temRetorno: false` na lista de cidades.
- **Persistência** ([prisma/schema.prisma](prisma/schema.prisma)): toda execução vira uma `Quotation` com `rawInput`, `extractedData`, `calculatedPrice`, `status`, `isPontaDeRota`, `distanceKm`, `createdAt`. Status: `PENDING` → `PROCESSED` ou `ERROR`.
- **API REST** ([src/app/api/quotations/route.ts](src/app/api/quotations/route.ts)): `POST /api/quotations` (cria + processa) e `GET /api/quotations?page=&limit=` (histórico paginado).
- **Sinalização de campos faltantes**: quando a extração não conseguiu pegar dado obrigatório (origem/destino/tipo/peso), o resultado mostra um alerta listando o que perguntar de volta ao cliente em vez de inventar.
- **Detecção de urgência** binária a partir de marcadores explícitos no texto.

## O que NÃO está implementado (de propósito)

Listado também na Reflexão pergunta 2.

- Ingestão de áudio/imagem (Respeitando ao máximo o limite de tempo de 4 horas não foi possível implementar a ingestão de áudio/imagem mas foi feito uma tentativa na branch development).
- Integração com WhatsApp ou e-mail.
- Resposta automática para o cliente.
- Verificação real de disponibilidade de frota.
- Login/auth/multi-tenant.
- Testes.
- Edição manual da extração antes de aprovar.

---

## Decisões importantes

- **Preço sai da planilha, sempre.** A LLM nunca decide preço. A restrição da Marília ("a planilha de tarifas é sagrada") foi tratada como invariante: o LLM extrai, o código procura na tabela, o número final vem da tabela ou não vem.
- **Confiança por campo, não por extração inteira.** Um número agregado seria inútil pro analista — ele precisa saber _qual_ campo confiar. O modelo devolve um score por campo no mesmo JSON, mostrado como badge.
- **Erros do LLM mapeados em status HTTP semânticos.** `504` para timeout, `422` para JSON inválido, `502` para erro da API. A extração é envelopada em uma `ExtractionError` tipada com `kind`, e a cotação fica marcada como `ERROR` no banco em vez de sumir.
- **Cidade ausente é null, não chute.** O prompt manda explicitamente "NÃO INVENTE" e mostra exemplos ("interior de SP" → cidade null, estado "SP"). Quando falta dado pra calcular, a UI mostra o que perguntar — não chuta um preço.
- **Distância vem de tabela, não de Maps.** Pra caber no tempo, as distâncias estão hardcoded entre as cidades cobertas.
- **Aprovar/descartar é o "humano no loop".** O analista continua no controle (restrição da Marília). Aprovar marca o registro como confirmado; descartar fecha o card sem alterar o histórico.
- **`gemini-2.5-flash`**. Latência menor pra um prompt curto e schema fixo; custo mais baixo.

---

## Reflexão

### 1. Por que esse pedaço do briefing?

Escolhi automatizar o miolo do fluxo da Júlia: **extração de dados da mensagem livre e cálculo de preço pela planilha-mestre**. Três motivos:

- É onde dói mais por unidade de tempo. Marília citou três sintomas (preço inconsistente entre analistas, planilha desatualizada, esquecimento de ponta de rota).
- É o pedaço com maior razão impacto/esforço para o tempo de 4h. Um LLM com schema fixo + tabela de tarifas resolve grande parte das cotações simples (rota conhecida, carga padrão).
- Mantém o analista no controle. O resultado vai pra revisão antes de virar resposta — não troquei pessoa por máquina, troquei 8–15 min de trabalho repetitivo por 1 min de revisão.

**Descartei:**

- **Transcrição de áudio** — alto valor pra Marília mas exige outra integração (Whisper/Gemini multimodal) que ultrapassaria o tempo limite. Tentei resolvelo mas pelo tempo não o consegui testar. Estando como segundo na fila.
- **Resposta automática no WhatsApp** — sair do MVP e entrar em business-message API. Seria impossível entregar a tempo pela complexidade e integrações necessárias.
- **Painel pra Marília** (cotações entradas/respondidas/paradas) — Bastante útil, mas o sistema precisa estar gerando dados consistentes antes de ter painel.
- **Atualização automática do diesel** — sonho da Marília, mas exige integração com fonte externa e regra de repasse. Também seria impossível entregar a tempo.

### 2. O que cortei pra caber em 4h

1. **Áudio e imagem.** Só textarea.
2. **Edição manual da extração antes de aprovar.** Hoje o analista aprova ou descarta.
3. **Disponibilidade de frota (passo 3 do fluxo).** Não tem TMS mockado. Só polígono de cobertura via lista de cidades.
4. **Distância real via Maps.** Tabela hardcoded entre pares conhecidos.
5. **Testes automatizados.** Validação foi manual com mensagens do briefing.
6. **Métricas de operação.** Sem painel.
7. **Ingestão por canal real.** Sem webhook de WhatsApp, sem IMAP de e-mail.
8. **Cache de extração.** Mensagens iguais estão sendo processadas de novo. Ponto importante mas pelo tempo curto não foi possivel implementar.

### 3. Se tivesse mais 4 horas

Em ordem de prioridade:

1. **Edição inline dos campos extraídos antes de aprovar**, com recálculo do preço quando o analista corrige peso/destino/tipo. É o que mais aproxima o fluxo do real.
2. **Transcrição de áudio** usando Gemini multimodal (passar `audio/ogg` direto) — destrava o canal mais comum(WhatsApp) e libera mais tempo para as atendentes responderem os clientes.
3. **Cache de prompt** (instruções fixas em uma `cached_content`) e cache de extração por hash da mensagem — corta custo no segundo turno do mesmo cliente.
4. **Validação semântica pós-extração**: se o LLM disse "Anápolis/SP", checar se Anápolis realmente fica em SP, defesa barata contra alucinação.
5. **Painel de operação** pra Marília: cotações entradas/respondidas/paradas, tempo médio, taxa de aprovação.
6. **2–3 testes** no `pricing.ts` (caminho feliz, ponta de rota, dados faltantes) e um teste de contrato no schema do extractor.
7. **Variável de ambiente pra modelo** (`AI_MODEL`) e fallback automático.

### 4. Como usei IA

- **Antigravity + Claude Code** durante todo o teste, utilizei IA como apoio para aprimorar meus prompts e acelerar o desenvolvimento. O prompt do extractor e a regra de cálculo foram escritos manualmente por mim; já a IA foi utilizada para otimizar tarefas como criação de componentes com shadcn, tipagem dos DTOs e documentação JSDoc dos handlers de erro.
- **Tipos de prompt utilizados:**
  - "leia [arquivo] e me proponha 3 schemas de Quotation diferentes, com prós/contras" — me ajudou a evitar campos que ia me arrepender depois.
  - "esse prompt do extractor cobre a mensagem do briefing X? aponte buracos" — pegou que eu não estava tratando "interior de SP" e negações tipo "preciso refrigerado? não".
  - Refactor mecânico ("transforme esse `let` num `const` com early return").
- **Onde a IA atrapalhou:**
  - Sugeriu várias vezes adicionar try/catch em volta de cálculos que nunca falham. Tive que segurar pra não over-engineer.
  - Em uma rodada, gerou um schema de Prisma com `String[]` (não suportado em SQLite) — peguei na primeira `prisma migrate`.
  - Reescreveu meu prompt do extractor numa versão "mais elegante" que perdeu os exemplos negativos. Voltei pro meu.
- **Onde acelerou de verdade:**
  - Componentes Tailwind/shadcn de `QuotationResult` — economizei bastante tempo na UI.
  - Geração das 50 combinações de tarifas em [src/data/tariffs.json](src/data/tariffs.json) — ditei a estrutura, IA preencheu números plausíveis.

### 5. Se fosse cliente real (latência, custo, falha, edge cases, observabilidade)

**Latência.** Hoje 2–6s por extração com Flash. Aceitável pro analista, ruim pro cliente esperando resposta. Em produção: pré-processar mensagem assim que entra (webhook do WhatsApp), não quando o analista abrir. Pra cotações simples (alta confiança em todos os campos obrigatórios), gerar a resposta automaticamente em até 30s.

**Custo.** Cotação típica gasta em torno de600 input + 400 output tokens equivalente a nais ou menos US$ 0.0002 com Flash. A 80 cotações/dia × 22 dias = ~3500/mês = **~US$ 0.7/mês de LLM**. Irrelevante até então mas já pensando no futuro vale a pena otimizar. O custo real aparece quando entrar áudio (Whisper ou Gemini multimodal a US$ 0.01/min).

Otimizações que valem mesmo com custo baixo:

- **Prompt caching** das instruções fixas (system prompt tem 1.5k tokens, repete em todo request).
- **Cache de extração** por hash da mensagem (clientes mandam a mesma cotação 2x ao longo do dia).
- **Modelo escalonado**: Flash por padrão, Pro só quando houver necessidade de maior precisão.

**Falha do modelo.** Hoje já tem timeout (30s), tipagem de erro e status `ERROR` persistido. Em produção:

- **Retry com backoff** em `502/504`, no máx 2x.
- **Circuit breaker**: se >5 erros em 1min, derrubar pra fila manual (analista vê todas como `PENDING`).
- **Validação de schema** pós-LLM com fallback pra reextração com prompt mais estrito quando o JSON está no formato errado.
- **Defensive parsing** de UF (`"sp"` → `"SP"`) e peso (`"12 ton"` → `12`) caso o modelo escape do schema.

**Edge cases reais.** Já vistos no briefing:

- Múltiplas cargas em uma mensagem ("4 cargas pra cotar"). Hoje pego só a primeira; certo seria detectar `n > 1` e mostrar uma tela de split.
- Áudio (65% do volume). Sem isso, qualquer número de adoção é teto baixo.
- Cliente que não fala peso/volume. Tratado: vira pergunta de volta, não chute.
- Rota fora da planilha-mestre. Tratado: status `ERROR` com motivo.
- "interior de SP" / regiões. Tratado no prompt.

**Observabilidade.**

- Logar input + output do LLM, tokens, latência, custo estimado. A tabela `Quotation` já tem
  ~80% disso.
- Métrica de **disagreement rate**: % de cotações em que o analista altera algo entre extrair e aprovar. É o indicador de qualidade da IA.
- **Alerta de drift**: se a taxa média de confiança cair abaixo do baseline em janelas de 1h, paginar.
- **Trace por cotação** (id no header) pra correlacionar log do app, request do LLM e ação do analista.

**Operação pelo time da LKW.** Restrição explícita do cliente (TI pequeno do lado deles). Pra manter esse pensamento: esta sendo utilizado variáveis de ambiente em vez de painel admin, planilha-mestre como JSON versionado em git (PR aprovado pela Marília vira deploy), zero infra além de SQLite/Postgres gerenciado.

---

## Tempo gasto

4h 46min, em uma sessão, contando com documentação e pesquisas sobre o projeto.
