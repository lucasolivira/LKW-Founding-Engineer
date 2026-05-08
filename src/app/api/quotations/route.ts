import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  EXTRACTION_TIMEOUT_MS,
  ExtractionError,
  runExtraction,
} from "@/lib/extraction";
import { calculatePrice } from "@/lib/pricing";
import { isPontaDeRota } from "@/lib/data-loader";
import {
  TranscriptionError,
  transcribeAudio,
} from "@/lib/transcription";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface PreparedInput {
  message: string;
  inputType: "text" | "audio";
  transcription?: { text: string; processingTimeMs: number };
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  let prepared: PreparedInput;
  try {
    if (contentType.includes("multipart/form-data")) {
      prepared = await prepareAudioInput(req);
    } else {
      prepared = await prepareTextInput(req);
    }
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof TranscriptionError) {
      const status =
        error.kind === "TIMEOUT"
          ? 504
          : error.kind === "TOO_LARGE" || error.kind === "UNSUPPORTED_FORMAT"
            ? 400
            : 502;
      return NextResponse.json(
        { error: error.message, kind: error.kind },
        { status },
      );
    }
    const details = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro inesperado", details }, { status: 500 });
  }

  const initial = await prisma.quotation.create({
    data: {
      rawInput: prepared.message,
      inputType: prepared.inputType,
      status: "PENDING",
    },
  });

  let extraction;
  try {
    extraction = await runExtraction(prepared.message);
  } catch (error) {
    await prisma.quotation.update({
      where: { id: initial.id },
      data: { status: "ERROR" },
    });

    if (error instanceof ExtractionError) {
      const status =
        error.kind === "TIMEOUT" ? 504 : error.kind === "INVALID_JSON" ? 422 : 502;
      return NextResponse.json(
        {
          quotationId: initial.id,
          error: error.message,
          kind: error.kind,
          ...(error.raw ? { raw: error.raw } : {}),
          ...(error.kind === "TIMEOUT" ? { timeoutMs: EXTRACTION_TIMEOUT_MS } : {}),
        },
        { status },
      );
    }
    const details = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { quotationId: initial.id, error: "Erro inesperado", details },
      { status: 500 },
    );
  }

  const price = calculatePrice(extraction.extracted);

  const ponta = !!(
    extraction.extracted.destinoCidade &&
    isPontaDeRota(
      extraction.extracted.destinoCidade,
      extraction.extracted.destinoEstado ?? undefined,
    )
  );

  const updated = await prisma.quotation.update({
    where: { id: initial.id },
    data: {
      extractedData: extraction.extracted as unknown as Prisma.InputJsonValue,
      calculatedPrice: price.precoFinal,
      isPontaDeRota: ponta,
      distanceKm: price.distanciaEstimada,
      status: price.precoFinal != null ? "PROCESSED" : "ERROR",
    },
  });

  return NextResponse.json(
    {
      quotation: updated,
      extraction,
      price,
      ...(prepared.transcription ? { transcription: prepared.transcription } : {}),
    },
    { status: 201 },
  );
}

class InputError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function prepareTextInput(req: NextRequest): Promise<PreparedInput> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new InputError("Body inválido: JSON esperado", 400);
  }
  const message = (body as { message?: unknown })?.message;
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new InputError(
      "Campo 'message' é obrigatório (string não vazia)",
      400,
    );
  }
  return { message: message.trim(), inputType: "text" };
}

async function prepareAudioInput(req: NextRequest): Promise<PreparedInput> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    throw new InputError("FormData inválido", 400);
  }
  const audio = formData.get("audio");
  if (!(audio instanceof File)) {
    throw new InputError("Campo 'audio' é obrigatório (File)", 400);
  }
  if (audio.size === 0) {
    throw new InputError("Arquivo de áudio está vazio", 400);
  }

  const transcription = await transcribeAudio(audio);
  return {
    message: transcription.text,
    inputType: "audio",
    transcription,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pageRaw = Number(searchParams.get("page") ?? "1");
  const limitRaw = Number(searchParams.get("limit") ?? String(DEFAULT_LIMIT));

  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const limit =
    Number.isFinite(limitRaw) && limitRaw >= 1
      ? Math.min(MAX_LIMIT, Math.floor(limitRaw))
      : DEFAULT_LIMIT;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.quotation.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.quotation.count(),
  ]);

  return NextResponse.json({
    items,
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  });
}
