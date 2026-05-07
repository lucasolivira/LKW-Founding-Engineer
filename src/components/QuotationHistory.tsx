"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ListQuotationsResponse, QuotationDTO } from "@/lib/api-types";

interface QuotationHistoryProps {
  refreshKey?: number;
}

const PAGE_SIZE = 10;

export function QuotationHistory({ refreshKey = 0 }: QuotationHistoryProps) {
  const [data, setData] = useState<ListQuotationsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/quotations?page=${page}&limit=${PAGE_SIZE}`)
      .then((r) => r.json())
      .then((d: ListQuotationsResponse) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, refreshKey]);

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg">📚 Histórico</CardTitle>
        <CardDescription>
          {data
            ? `${data.total} ${data.total === 1 ? "cotação" : "cotações"}`
            : "Carregando…"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && !data && <HistorySkeleton />}

        {data && data.items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma cotação ainda.
          </p>
        )}

        {data?.items.map((q) => (
          <HistoryItem
            key={q.id}
            quotation={q}
            isExpanded={expanded === q.id}
            onToggle={() => setExpanded(expanded === q.id ? null : q.id)}
          />
        ))}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              {data.page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryItem({
  quotation,
  isExpanded,
  onToggle,
}: {
  quotation: QuotationDTO;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const created = new Date(quotation.createdAt);
  const dateStr = created.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const ext = quotation.extractedData;
  const origem = ext
    ? cityState(ext.origemCidade, ext.origemEstado)
    : "—";
  const destino = ext
    ? cityState(ext.destinoCidade, ext.destinoEstado)
    : "—";

  const price =
    quotation.calculatedPrice == null
      ? "—"
      : quotation.calculatedPrice.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 2,
        });

  return (
    <div className="rounded-lg border transition-colors hover:bg-muted/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{dateStr}</span>
            <StatusPill status={quotation.status} />
            {quotation.isPontaDeRota && (
              <Badge variant="warning" className="text-[10px]">
                ponta de rota
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-medium">
            {origem} → {destino}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-semibold">{price}</p>
          <p className="text-[10px] text-muted-foreground">
            {isExpanded ? "▲" : "▼"}
          </p>
        </div>
      </button>

      {isExpanded && <ExpandedDetails quotation={quotation} />}
    </div>
  );
}

function ExpandedDetails({ quotation }: { quotation: QuotationDTO }) {
  const ext = quotation.extractedData;
  return (
    <div className="space-y-2 border-t bg-muted/30 px-3 py-3 text-xs">
      <div>
        <p className="font-semibold uppercase tracking-wide text-muted-foreground">
          Mensagem original
        </p>
        <p className="mt-1 whitespace-pre-wrap text-foreground">
          {quotation.rawInput}
        </p>
      </div>

      {ext && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Field label="Tipo carga" value={ext.tipoCarga ?? "—"} />
          <Field
            label="Peso"
            value={ext.pesoToneladas != null ? `${ext.pesoToneladas} t` : "—"}
          />
          <Field
            label="Volume"
            value={ext.volumeM3 != null ? `${ext.volumeM3} m³` : "—"}
          />
          <Field label="Veículo" value={ext.tipoVeiculo ?? "—"} />
          <Field label="Coleta" value={ext.prazoColeta ?? "—"} />
          <Field label="Entrega" value={ext.prazoEntrega ?? "—"} />
          <Field
            label="Distância"
            value={
              quotation.distanceKm != null ? `${quotation.distanceKm} km` : "—"
            }
          />
          <Field label="Urgente" value={ext.urgente ? "sim" : "não"} />
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "PROCESSED")
    return <Badge variant="success" className="text-[10px]">processado</Badge>;
  if (status === "ERROR")
    return <Badge variant="danger" className="text-[10px]">erro</Badge>;
  return <Badge variant="warning" className="text-[10px]">pendente</Badge>;
}

function HistorySkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </>
  );
}

function cityState(city: string | null, state: string | null): string {
  if (!city && !state) return "—";
  if (!city) return state ?? "—";
  if (!state) return city;
  return `${city}-${state}`;
}
