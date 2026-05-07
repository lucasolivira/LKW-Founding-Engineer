import type { TipoCarga, TipoVeiculo } from "./data-loader";

export type QuotationStatus = "PENDING" | "PROCESSED" | "ERROR";

export type ConfidenceScore = number;

export interface ExtractionConfidence {
  origemCidade: ConfidenceScore;
  origemEstado: ConfidenceScore;
  destinoCidade: ConfidenceScore;
  destinoEstado: ConfidenceScore;
  tipoCarga: ConfidenceScore;
  pesoToneladas: ConfidenceScore;
  volumeM3: ConfidenceScore;
  tipoVeiculo: ConfidenceScore;
  prazoColeta: ConfidenceScore;
  prazoEntrega: ConfidenceScore;
  restricoes: ConfidenceScore;
  urgente: ConfidenceScore;
}

export interface ExtractedQuotationData {
  origemCidade: string | null;
  origemEstado: string | null;
  destinoCidade: string | null;
  destinoEstado: string | null;
  tipoCarga: TipoCarga | null;
  pesoToneladas: number | null;
  volumeM3: number | null;
  tipoVeiculo: TipoVeiculo | null;
  prazoColeta: string | null;
  prazoEntrega: string | null;
  restricoes: string[] | null;
  urgente: boolean;
  confianca: ExtractionConfidence;
}

export interface ExtractTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ExtractApiResponse {
  extracted: ExtractedQuotationData;
  usage: ExtractTokenUsage;
  processingTimeMs: number;
}

export interface Quotation {
  id: string;
  rawInput: string;
  extractedData: ExtractedQuotationData | null;
  calculatedPrice: number | null;
  status: QuotationStatus;
  isPontaDeRota: boolean;
  distanceKm: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuotationInput {
  rawInput: string;
}

export interface UpdateQuotationInput {
  extractedData?: ExtractedQuotationData;
  calculatedPrice?: number;
  status?: QuotationStatus;
  isPontaDeRota?: boolean;
  distanceKm?: number;
}
