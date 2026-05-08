import { gemini, GEMINI_MODEL } from "./gemini";

const TRANSCRIPTION_TIMEOUT_MS = 60_000;
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

const TRANSCRIPTION_PROMPT = `Transcreva fielmente o áudio em português brasileiro.
Retorne APENAS o texto falado, sem comentários adicionais, sem cabeçalhos, sem aspas.
Mantenha a fala literal incluindo nomes próprios (Marília, cidades, etc.) e números falados (ex: "doze toneladas").
Não traduza, não resuma, não adicione pontuação além do natural.`;

const SUPPORTED_GEMINI_MIME = new Set([
  "audio/wav",
  "audio/mp3",
  "audio/mpeg",
  "audio/aiff",
  "audio/aac",
  "audio/ogg",
  "audio/flac",
  "audio/mp4",
  "audio/webm",
]);

export type TranscriptionErrorKind =
  | "TIMEOUT"
  | "UNSUPPORTED_FORMAT"
  | "TOO_LARGE"
  | "EMPTY_TRANSCRIPTION"
  | "API_ERROR";

export class TranscriptionError extends Error {
  constructor(
    public readonly kind: TranscriptionErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "TranscriptionError";
  }
}

class TimeoutError extends Error {
  constructor() {
    super("TIMEOUT");
    this.name = "TimeoutError";
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
      },
    );
  });
}

export function resolveAudioMimeType(file: File): string {
  if (file.type && file.type.startsWith("audio/")) {
    if (file.type === "audio/opus") return "audio/ogg";
    if (file.type === "audio/x-m4a") return "audio/mp4";
    if (file.type === "audio/wave" || file.type === "audio/x-wav")
      return "audio/wav";
    return file.type;
  }
  const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  switch (ext) {
    case "mp3":
      return "audio/mp3";
    case "ogg":
    case "opus":
      return "audio/ogg";
    case "wav":
      return "audio/wav";
    case "m4a":
    case "mp4":
      return "audio/mp4";
    case "aac":
      return "audio/aac";
    case "flac":
      return "audio/flac";
    case "webm":
      return "audio/webm";
    default:
      return "audio/mpeg";
  }
}

export interface TranscriptionResult {
  text: string;
  processingTimeMs: number;
}

export async function transcribeAudio(
  file: File,
): Promise<TranscriptionResult> {
  if (file.size > MAX_AUDIO_BYTES) {
    throw new TranscriptionError(
      "TOO_LARGE",
      `Áudio excede o limite (${Math.round(MAX_AUDIO_BYTES / 1024 / 1024)} MB)`,
    );
  }

  const mimeType = resolveAudioMimeType(file);
  if (!SUPPORTED_GEMINI_MIME.has(mimeType)) {
    throw new TranscriptionError(
      "UNSUPPORTED_FORMAT",
      `Formato não suportado: ${mimeType}`,
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const startedAt = Date.now();
  let response;
  try {
    response = await withTimeout(
      gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: TRANSCRIPTION_PROMPT },
            ],
          },
        ],
        config: { temperature: 0 },
      }),
      TRANSCRIPTION_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      throw new TranscriptionError(
        "TIMEOUT",
        `Timeout (${TRANSCRIPTION_TIMEOUT_MS}ms) ao transcrever`,
      );
    }
    const details = error instanceof Error ? error.message : "Erro desconhecido";
    throw new TranscriptionError("API_ERROR", details);
  }

  const text = (response.text ?? "").trim();
  if (!text) {
    throw new TranscriptionError(
      "EMPTY_TRANSCRIPTION",
      "Transcrição vazia retornada pelo LLM",
    );
  }

  return {
    text,
    processingTimeMs: Date.now() - startedAt,
  };
}
