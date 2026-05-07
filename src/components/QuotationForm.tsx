"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { CreateQuotationResponse } from "@/lib/api-types";

const PLACEHOLDER = `Ex.: "Bom dia Marília, preciso de cotação para amanhã, tenho 12 toneladas de fertilizante saindo de Rio Verde GO indo para Patos de Minas, tem caminhão?"`;

interface QuotationFormProps {
  onResult: (result: CreateQuotationResponse) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function QuotationForm({ onResult, loading, setLoading }: QuotationFormProps) {
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      onResult(
        res.ok
          ? { ok: true, status: res.status, data }
          : { ok: false, status: res.status, data },
      );
    } catch (e) {
      onResult({
        ok: false,
        status: 0,
        data: {
          error: e instanceof Error ? e.message : "Erro de rede",
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          🚛 Assistente de Cotação — Verdebrasil
        </CardTitle>
        <CardDescription>
          Cole a mensagem do cliente (WhatsApp, e-mail) e o assistente extrai
          os dados e calcula o preço com base na planilha-mestre.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={6}
          disabled={loading}
          className="resize-none text-base leading-relaxed"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Atalho: <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">⌘ Enter</kbd>
          </p>
          <Button
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
            size="lg"
          >
            {loading ? (
              <>
                <Spinner />
                Extraindo dados e calculando…
              </>
            ) : (
              <>⚡ Processar Cotação</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}
