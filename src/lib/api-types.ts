import type {
  ExtractedQuotationData,
  ExtractTokenUsage,
  InputType,
  QuotationStatus,
} from "./types";
import type { FaixaKm, Tariff } from "./data-loader";

export interface PriceBreakdownDTO {
  precoFinal: number | null;
  precoBase: number | null;
  adicionalPontaDeRota: number;
  pedagio: number;
  tarifaUsada: Tariff | null;
  faixaKm: FaixaKm | null;
  distanciaEstimada: number | null;
  detalhesCalculo: string[];
}

export interface QuotationDTO {
  id: string;
  rawInput: string;
  inputType: InputType;
  extractedData: ExtractedQuotationData | null;
  calculatedPrice: number | null;
  status: QuotationStatus;
  isPontaDeRota: boolean;
  distanceKm: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotationSuccess {
  quotation: QuotationDTO;
  extraction: {
    extracted: ExtractedQuotationData;
    usage: ExtractTokenUsage;
    processingTimeMs: number;
  };
  price: PriceBreakdownDTO;
  transcription?: {
    text: string;
    processingTimeMs: number;
  };
}

export interface CreateQuotationFailure {
  error: string;
  quotationId?: string;
  kind?: "TIMEOUT" | "INVALID_JSON" | "EMPTY_RESPONSE" | "API_ERROR";
  details?: string;
  timeoutMs?: number;
  raw?: string;
}

export type CreateQuotationResponse =
  | { ok: true; status: number; data: CreateQuotationSuccess }
  | { ok: false; status: number; data: CreateQuotationFailure };

export interface ListQuotationsResponse {
  items: QuotationDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
