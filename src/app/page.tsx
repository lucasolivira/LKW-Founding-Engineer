"use client";

import { useState } from "react";

import { QuotationForm } from "@/components/QuotationForm";
import { QuotationHistory } from "@/components/QuotationHistory";
import { QuotationResult } from "@/components/QuotationResult";
import { Card, CardContent } from "@/components/ui/card";
import type { CreateQuotationResponse } from "@/lib/api-types";

export default function Home() {
  const [result, setResult] = useState<CreateQuotationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleResult(r: CreateQuotationResponse) {
    setResult(r);
    if (r.ok) setRefreshKey((k) => k + 1);
  }

  function handleApprove() {
    setResult(null);
    setRefreshKey((k) => k + 1);
  }

  function handleDiscard() {
    setResult(null);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-secondary/40 to-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            LKW · Verdebrasil
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cotação de Frete com IA
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <QuotationForm
              onResult={handleResult}
              loading={loading}
              setLoading={setLoading}
            />

            {loading && <LoadingCard />}

            {!loading && result && (
              <QuotationResult
                result={result}
                onApprove={handleApprove}
                onDiscard={handleDiscard}
              />
            )}
          </div>

          <aside>
            <QuotationHistory refreshKey={refreshKey} />
          </aside>
        </div>
      </div>
    </main>
  );
}

function LoadingCard() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-10">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <div>
          <p className="font-medium">Extraindo dados e calculando…</p>
          <p className="text-sm text-muted-foreground">
            Chamando o LLM e consultando a planilha-mestre.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
