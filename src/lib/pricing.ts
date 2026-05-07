import {
  PONTA_DE_ROTA_ADICIONAL,
  distanceKmToFaixa,
  findTariff,
  getTollEstimate,
  isPontaDeRota,
  type FaixaKm,
  type Tariff,
  type TipoVeiculo,
} from "./data-loader";
import { estimateDistanceKm } from "./distances";
import type { ExtractedQuotationData } from "./types";

export interface PriceBreakdown {
  precoFinal: number | null;
  precoBase: number | null;
  adicionalPontaDeRota: number;
  pedagio: number;
  tarifaUsada: Tariff | null;
  faixaKm: FaixaKm | null;
  distanciaEstimada: number | null;
  detalhesCalculo: string[];
}

export function inferTipoVeiculo(pesoToneladas: number): TipoVeiculo {
  if (pesoToneladas <= 6) return "toco";
  if (pesoToneladas <= 14) return "truck";
  if (pesoToneladas <= 27) return "carreta";
  return "bitrem";
}

function brl(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function calculatePrice(data: ExtractedQuotationData): PriceBreakdown {
  const detalhes: string[] = [];
  const result: PriceBreakdown = {
    precoFinal: null,
    precoBase: null,
    adicionalPontaDeRota: 0,
    pedagio: 0,
    tarifaUsada: null,
    faixaKm: null,
    distanciaEstimada: null,
    detalhesCalculo: detalhes,
  };

  const faltando: string[] = [];
  if (!data.origemEstado) faltando.push("origemEstado");
  if (!data.destinoEstado) faltando.push("destinoEstado");
  if (data.pesoToneladas == null) faltando.push("pesoToneladas");
  if (!data.tipoCarga) faltando.push("tipoCarga");

  if (faltando.length > 0) {
    detalhes.push(
      `Dados obrigatórios ausentes: ${faltando.join(", ")}. Preço não pôde ser calculado.`,
    );
    return result;
  }

  const origemUF = data.origemEstado as string;
  const destinoUF = data.destinoEstado as string;
  const peso = data.pesoToneladas as number;
  const tipoCarga = data.tipoCarga!;

  let tipoVeiculo: TipoVeiculo;
  if (data.tipoVeiculo) {
    tipoVeiculo = data.tipoVeiculo;
    detalhes.push(`Veículo informado pelo cliente: ${tipoVeiculo}.`);
  } else {
    tipoVeiculo = inferTipoVeiculo(peso);
    detalhes.push(
      `Veículo inferido pelo peso (${peso}t → ${tipoVeiculo}; regra: ≤6t toco, ≤14t truck, ≤27t carreta, >27t bitrem).`,
    );
  }

  const distancia = estimateDistanceKm(
    origemUF,
    data.origemCidade,
    destinoUF,
    data.destinoCidade,
  );
  if (distancia == null) {
    detalhes.push(
      `Distância não cadastrada para a rota ${origemUF} → ${destinoUF}. Preço não pôde ser calculado.`,
    );
    return result;
  }
  result.distanciaEstimada = distancia;
  detalhes.push(
    `Distância estimada (${data.origemCidade ?? origemUF} → ${data.destinoCidade ?? destinoUF}): ${distancia} km.`,
  );

  const faixaKm = distanceKmToFaixa(distancia);
  result.faixaKm = faixaKm;
  detalhes.push(`Faixa de quilometragem: ${faixaKm}.`);

  const tarifa = findTariff({
    estadoOrigem: origemUF,
    estadoDestino: destinoUF,
    faixaKm,
    tipoCarga,
    tipoVeiculo,
  });
  if (!tarifa) {
    detalhes.push(
      `Tarifa não encontrada na planilha-mestre para ${origemUF}→${destinoUF}, ${faixaKm}, ${tipoCarga}, ${tipoVeiculo}. Preço não pôde ser calculado.`,
    );
    return result;
  }
  result.tarifaUsada = tarifa;
  detalhes.push(
    `Tarifa da planilha-mestre: ${brl(tarifa.valorBaseTon)}/ton (${tarifa.estadoOrigem}→${tarifa.estadoDestino}, ${tarifa.faixaKm}, ${tarifa.tipoCarga}, ${tarifa.tipoVeiculo}).`,
  );

  const precoBase = tarifa.valorBaseTon * peso;
  result.precoBase = precoBase;
  detalhes.push(
    `Preço base: ${peso}t × ${brl(tarifa.valorBaseTon)}/ton = ${brl(precoBase)}.`,
  );

  let adicional = 0;
  if (data.destinoCidade && isPontaDeRota(data.destinoCidade, destinoUF)) {
    adicional = precoBase * PONTA_DE_ROTA_ADICIONAL;
    detalhes.push(
      `Ponta de rota detectada (${data.destinoCidade}-${destinoUF}, sem retorno): adicional de ${(PONTA_DE_ROTA_ADICIONAL * 100).toFixed(0)}% = ${brl(adicional)}.`,
    );
  } else {
    detalhes.push("Sem adicional de ponta de rota.");
  }
  result.adicionalPontaDeRota = adicional;

  const pedagio = getTollEstimate(faixaKm);
  result.pedagio = pedagio;
  detalhes.push(`Pedágio estimado (faixa ${faixaKm}): ${brl(pedagio)}.`);

  const precoFinal = precoBase + adicional + pedagio;
  result.precoFinal = precoFinal;
  detalhes.push(
    `Preço final: ${brl(precoBase)} + ${brl(adicional)} + ${brl(pedagio)} = ${brl(precoFinal)}.`,
  );

  return result;
}
