"use client";

import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CreateQuotationResponse, PriceBreakdownDTO } from "@/lib/api-types";
import type { ExtractedQuotationData } from "@/lib/types";

interface QuotationResultProps {
  result: CreateQuotationResponse;
  onApprove?: () => void;
  onDiscard?: () => void;
}

const REQUIRED_FIELDS: Array<{
  key: keyof ExtractedQuotationData;
  label: string;
  human: string;
}> = [
  { key: "origemEstado", label: "origemEstado", human: "estado de origem" },
  { key: "destinoEstado", label: "destinoEstado", human: "estado de destino" },
  { key: "tipoCarga", label: "tipoCarga", human: "tipo de carga" },
  { key: "pesoToneladas", label: "pesoToneladas", human: "peso (toneladas)" },
];

export function QuotationResult({ result, onApprove, onDiscard }: QuotationResultProps) {
  if (!result.ok) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">❌ Falha ao processar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Alert variant="destructive">
            <AlertTitle>{result.data.error}</AlertTitle>
            {result.data.kind && (
              <AlertDescription>
                Tipo: <code className="font-mono text-xs">{result.data.kind}</code>
                {typeof result.data.timeoutMs === "number" && (
                  <> · timeout: {result.data.timeoutMs}ms</>
                )}
              </AlertDescription>
            )}
          </Alert>
          {result.data.details && (
            <p className="text-muted-foreground">{result.data.details}</p>
          )}
          <Button variant="outline" onClick={onDiscard}>
            Fechar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { extraction, price, quotation } = result.data;
  const { extracted } = extraction;

  const missing = REQUIRED_FIELDS.filter((f) => {
    const v = extracted[f.key];
    return v == null || v === "";
  });

  const formatBRL = (n: number | null) =>
    n == null
      ? "—"
      : n.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 2,
        });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-xl">📋 Resultado</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            ID: <code className="font-mono">{quotation.id}</code> ·
            Extração: {extraction.processingTimeMs}ms ·
            Tokens: {extraction.usage.totalTokens}
          </p>
        </div>
        <StatusBadge status={quotation.status} hasPrice={price.precoFinal != null} />
      </CardHeader>

      <CardContent className="space-y-6">
        <ExtractedSection extracted={extracted} />

        <Separator />

        <PriceSection
          price={price}
          formatBRL={formatBRL}
          isPontaDeRota={quotation.isPontaDeRota}
        />

        {missing.length > 0 && (
          <Alert variant="warning">
            <AlertTitle>⚠️ Campos faltantes — perguntar ao cliente</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {missing.map((f) => (
                  <li key={f.label}>
                    <strong>{f.human}</strong> não foi informado.
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            variant="success"
            size="lg"
            onClick={onApprove}
            disabled={price.precoFinal == null}
          >
            ✅ Aprovar Cotação
          </Button>
          <Button variant="outline" size="lg" onClick={onDiscard}>
            🗑️ Descartar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
  hasPrice,
}: {
  status: string;
  hasPrice: boolean;
}) {
  if (status === "PROCESSED" && hasPrice)
    return <Badge variant="success">Processado</Badge>;
  if (status === "ERROR") return <Badge variant="danger">Erro</Badge>;
  return <Badge variant="warning">Parcial</Badge>;
}

function ExtractedSection({ extracted }: { extracted: ExtractedQuotationData }) {
  const c = extracted.confianca;
  const formatPeso = (n: number | null) => (n == null ? "—" : `${n} t`);
  const formatVolume = (n: number | null) => (n == null ? "—" : `${n} m³`);

  const rows: Array<{
    label: string;
    value: React.ReactNode;
    score: number;
  }> = [
    {
      label: "Origem",
      value: cityState(extracted.origemCidade, extracted.origemEstado),
      score: Math.min(c.origemCidade ?? 0, c.origemEstado ?? 0),
    },
    {
      label: "Destino",
      value: cityState(extracted.destinoCidade, extracted.destinoEstado),
      score: Math.min(c.destinoCidade ?? 0, c.destinoEstado ?? 0),
    },
    {
      label: "Tipo de carga",
      value: extracted.tipoCarga ?? "—",
      score: c.tipoCarga ?? 0,
    },
    {
      label: "Peso",
      value: formatPeso(extracted.pesoToneladas),
      score: c.pesoToneladas ?? 0,
    },
    {
      label: "Volume",
      value: formatVolume(extracted.volumeM3),
      score: c.volumeM3 ?? 0,
    },
    {
      label: "Veículo",
      value: extracted.tipoVeiculo ?? "—",
      score: c.tipoVeiculo ?? 0,
    },
    {
      label: "Coleta",
      value: extracted.prazoColeta ?? "—",
      score: c.prazoColeta ?? 0,
    },
    {
      label: "Entrega",
      value: extracted.prazoEntrega ?? "—",
      score: c.prazoEntrega ?? 0,
    },
  ];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dados extraídos
        </h3>
        {extracted.urgente && <Badge variant="destructive">🔥 Urgente</Badge>}
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2"
          >
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="truncate text-sm font-medium">{row.value}</dd>
            </div>
            <ConfidenceBadge score={row.score} showLabel={false} />
          </div>
        ))}
      </dl>
      {extracted.restricoes && extracted.restricoes.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Restrições:</span>
          {extracted.restricoes.map((r) => (
            <Badge key={r} variant="outline">
              {r}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}

function PriceSection({
  price,
  formatBRL,
  isPontaDeRota,
}: {
  price: PriceBreakdownDTO;
  formatBRL: (n: number | null) => string;
  isPontaDeRota: boolean;
}) {
  const hasPrice = price.precoFinal != null;

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Cálculo de preço
      </h3>

      {hasPrice ? (
        <>
          <div className="rounded-lg bg-primary/5 p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Preço final
            </p>
            <p className="mt-1 font-mono text-4xl font-bold text-primary">
              {formatBRL(price.precoFinal)}
            </p>
            {price.distanciaEstimada != null && (
              <p className="mt-2 text-xs text-muted-foreground">
                {price.distanciaEstimada} km · faixa {price.faixaKm}
                {price.tarifaUsada && (
                  <>
                    {" · "}
                    tarifa {formatBRL(price.tarifaUsada.valorBaseTon)}/ton (
                    {price.tarifaUsada.tipoCarga} · {price.tarifaUsada.tipoVeiculo})
                  </>
                )}
              </p>
            )}
          </div>

          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <BreakdownRow label="Tarifa base" value={formatBRL(price.precoBase)} />
            <BreakdownRow
              label={`Ponta de rota${isPontaDeRota ? " (+15%)" : ""}`}
              value={formatBRL(price.adicionalPontaDeRota)}
              muted={!isPontaDeRota}
            />
            <BreakdownRow label="Pedágio" value={formatBRL(price.pedagio)} />
          </dl>
        </>
      ) : (
        <Alert variant="warning">
          <AlertTitle>Preço não calculado</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {price.detalhesCalculo.map((d, i) => (
                <li key={i} className="text-sm">
                  {d}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {hasPrice && price.detalhesCalculo.length > 0 && (
        <details className="mt-3 text-sm text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">
            Detalhamento do cálculo
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {price.detalhesCalculo.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function BreakdownRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 ${muted ? "opacity-60" : ""}`}
    >
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm font-medium">{value}</dd>
    </div>
  );
}

function cityState(city: string | null, state: string | null): string {
  if (!city && !state) return "—";
  if (!city) return state ?? "—";
  if (!state) return city;
  return `${city}, ${state}`;
}
