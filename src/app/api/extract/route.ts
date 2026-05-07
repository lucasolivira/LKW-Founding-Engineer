import { NextRequest, NextResponse } from "next/server";
import {
  EXTRACTION_TIMEOUT_MS,
  ExtractionError,
  runExtraction,
} from "@/lib/extraction";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido: JSON esperado" },
      { status: 400 },
    );
  }

  const message = (body as { message?: unknown })?.message;
  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Campo 'message' é obrigatório (string não vazia)" },
      { status: 400 },
    );
  }

  try {
    const result = await runExtraction(message);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ExtractionError) {
      switch (error.kind) {
        case "TIMEOUT":
          return NextResponse.json(
            { error: error.message, timeoutMs: EXTRACTION_TIMEOUT_MS },
            { status: 504 },
          );
        case "INVALID_JSON":
          return NextResponse.json(
            { error: error.message, raw: error.raw },
            { status: 422 },
          );
        case "EMPTY_RESPONSE":
          return NextResponse.json({ error: error.message }, { status: 502 });
        case "API_ERROR":
          return NextResponse.json(
            { error: "Falha ao chamar o LLM", details: error.message },
            { status: 502 },
          );
      }
    }
    const details = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro inesperado", details },
      { status: 500 },
    );
  }
}
