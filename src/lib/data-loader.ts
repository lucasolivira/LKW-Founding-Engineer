import tariffsRaw from "@/data/tariffs.json";
import citiesRaw from "@/data/cities.json";
import tollsRaw from "@/data/toll-estimates.json";

export type FaixaKm = "0-200" | "200-500" | "500-1000" | "1000-2000" | "2000+";
export type TipoCarga = "seca" | "refrigerada" | "fracionada" | "perigosa";
export type TipoVeiculo = "toco" | "truck" | "carreta" | "bitrem";

export const PONTA_DE_ROTA_ADICIONAL = 0.15;

export interface Tariff {
  estadoOrigem: string;
  estadoDestino: string;
  faixaKm: FaixaKm;
  tipoCarga: TipoCarga;
  tipoVeiculo: TipoVeiculo;
  valorBaseTon: number;
}

export interface City {
  nome: string;
  estado: string;
  coberta: boolean;
  temRetorno: boolean;
}

interface TariffsFile {
  version: number;
  moeda: string;
  unidade: string;
  atualizadoEm: string;
  combinacoes: Tariff[];
}

interface CitiesFile {
  version: number;
  atualizadoEm: string;
  cidades: City[];
}

interface TollsFile {
  version: number;
  moeda: string;
  unidade: string;
  atualizadoEm: string;
  estimativas: Record<FaixaKm, number>;
}

const tariffs = tariffsRaw as TariffsFile;
const cities = citiesRaw as CitiesFile;
const tolls = tollsRaw as TollsFile;

export function distanceKmToFaixa(km: number): FaixaKm {
  if (km <= 200) return "0-200";
  if (km <= 500) return "200-500";
  if (km <= 1000) return "500-1000";
  if (km <= 2000) return "1000-2000";
  return "2000+";
}

export interface FindTariffParams {
  estadoOrigem: string;
  estadoDestino: string;
  distanceKm?: number;
  faixaKm?: FaixaKm;
  tipoCarga: TipoCarga;
  tipoVeiculo: TipoVeiculo;
}

export function findTariff(params: FindTariffParams): Tariff | null {
  const faixa =
    params.faixaKm ??
    (typeof params.distanceKm === "number"
      ? distanceKmToFaixa(params.distanceKm)
      : null);
  if (!faixa) return null;

  const uf = (s: string) => s.trim().toUpperCase();
  return (
    tariffs.combinacoes.find(
      (t) =>
        t.estadoOrigem === uf(params.estadoOrigem) &&
        t.estadoDestino === uf(params.estadoDestino) &&
        t.faixaKm === faixa &&
        t.tipoCarga === params.tipoCarga &&
        t.tipoVeiculo === params.tipoVeiculo,
    ) ?? null
  );
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function findCity(nome: string, estado?: string): City | null {
  const target = normalize(nome);
  const uf = estado?.trim().toUpperCase();
  return (
    cities.cidades.find(
      (c) =>
        normalize(c.nome) === target &&
        (!uf || c.estado.toUpperCase() === uf),
    ) ?? null
  );
}

export function getTollEstimate(faixaKm: FaixaKm): number {
  return tolls.estimativas[faixaKm] ?? 0;
}

export function isPontaDeRota(
  cidadeDestino: string,
  estadoDestino?: string,
): boolean {
  const city = findCity(cidadeDestino, estadoDestino);
  if (!city) return false;
  return city.temRetorno === false;
}

export function listCities(): City[] {
  return cities.cidades;
}

export function listTariffs(): Tariff[] {
  return tariffs.combinacoes;
}
