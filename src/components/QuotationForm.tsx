"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CreateQuotationResponse } from "@/lib/api-types";

const PLACEHOLDER = `Ex.: "Bom dia Marília, preciso de cotação para amanhã, tenho 12 toneladas de fertilizante saindo de Rio Verde GO indo para Patos de Minas, tem caminhão?"`;

const ACCEPTED_AUDIO_EXTENSIONS = [
  ".opus",
  ".ogg",
  ".mp3",
  ".wav",
  ".m4a",
  ".mp4",
  ".aac",
  ".flac",
  ".webm",
];

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

type InputMode = "text" | "audio";

interface QuotationFormProps {
  onResult: (result: CreateQuotationResponse) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function QuotationForm({ onResult, loading, setLoading }: QuotationFormProps) {
  const [mode, setMode] = useState<InputMode>("text");
  const [message, setMessage] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const canSubmit = mode === "text" ? message.trim().length > 0 : audioFile != null;

  async function handleSubmit() {
    if (loading || !canSubmit) return;
    setLoading(true);

    try {
      const res =
        mode === "text"
          ? await fetch("/api/quotations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: message.trim() }),
            })
          : await (async () => {
              const fd = new FormData();
              fd.append("audio", audioFile as File);
              return fetch("/api/quotations", { method: "POST", body: fd });
            })();

      const data = await res.json();
      const ok = res.ok;
      onResult(
        ok
          ? { ok: true, status: res.status, data }
          : { ok: false, status: res.status, data },
      );

      if (ok) {
        if (mode === "text") setMessage("");
        else setAudioFile(null);
      }
    } catch (e) {
      onResult({
        ok: false,
        status: 0,
        data: { error: e instanceof Error ? e.message : "Erro de rede" },
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
          Cole a mensagem do cliente (WhatsApp, e-mail) ou envie um áudio. O
          assistente extrai os dados e calcula o preço com base na
          planilha-mestre.
        </CardDescription>

        <div className="flex items-center gap-2 pt-2">
          <ModeButton
            active={mode === "text"}
            disabled={loading}
            onClick={() => setMode("text")}
          >
            📝 Texto
          </ModeButton>
          <ModeButton
            active={mode === "audio"}
            disabled={loading}
            onClick={() => setMode("audio")}
            className="ml-auto"
          >
            🎤 Áudio
          </ModeButton>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {mode === "text" ? (
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
        ) : (
          <AudioUploader
            file={audioFile}
            error={audioError}
            disabled={loading}
            onFile={(f) => {
              const error = validateAudioFile(f);
              if (error) {
                setAudioError(error);
                setAudioFile(null);
                return;
              }
              setAudioError(null);
              setAudioFile(f);
            }}
            onClear={() => {
              setAudioFile(null);
              setAudioError(null);
            }}
          />
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {mode === "text" ? (
              <>
                Atalho:{" "}
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                  ⌘ Enter
                </kbd>
              </>
            ) : (
              "O áudio será transcrito automaticamente antes do cálculo."
            )}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            size="lg"
          >
            {loading ? (
              <>
                <Spinner />
                {mode === "audio"
                  ? "Transcrevendo e processando…"
                  : "Extraindo dados e calculando…"}
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

function ModeButton({
  active,
  disabled,
  onClick,
  children,
  className,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

function validateAudioFile(file: File): string | null {
  if (file.size === 0) return "Arquivo vazio.";
  if (file.size > MAX_AUDIO_BYTES) {
    return `Arquivo muito grande (máx ${Math.round(MAX_AUDIO_BYTES / 1024 / 1024)} MB).`;
  }
  if (file.type && file.type.startsWith("audio/")) return null;
  const lower = file.name.toLowerCase();
  if (ACCEPTED_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))) return null;
  return `Formato não suportado. Use: ${ACCEPTED_AUDIO_EXTENSIONS.join(", ")}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function AudioUploader({
  file,
  error,
  disabled,
  onFile,
  onClear,
}: {
  file: File | null;
  error: string | null;
  disabled: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex min-h-[176px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center transition-colors",
          !disabled && "cursor-pointer hover:bg-muted/50",
          dragOver && "border-primary bg-primary/5",
          error && "border-destructive/60 bg-destructive/5",
          disabled && "cursor-not-allowed opacity-60",
        )}
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          accept={`audio/*,${ACCEPTED_AUDIO_EXTENSIONS.join(",")}`}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />

        {file ? (
          <>
            <span className="text-3xl" aria-hidden>
              🎵
            </span>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
              {file.type ? ` · ${file.type}` : ""}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  openPicker();
                }}
                disabled={disabled}
              >
                Trocar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                disabled={disabled}
              >
                Remover
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="text-3xl" aria-hidden>
              🎤
            </span>
            <p className="text-sm font-medium">
              Clique ou arraste um áudio aqui
            </p>
            <p className="text-xs text-muted-foreground">
              {ACCEPTED_AUDIO_EXTENSIONS.join(" · ")}
              {" · "}até {Math.round(MAX_AUDIO_BYTES / 1024 / 1024)} MB
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
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
