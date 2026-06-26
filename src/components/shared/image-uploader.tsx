"use client";

import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE_MB = 5;

interface ImageUploaderProps {
  value?: string | null;
  onChange: (file: File) => void | Promise<void>;
  onRemove?: () => void;
  label?: string;
  hint?: string;
  aspectRatio?: "square" | "cover" | "free";
  disabled?: boolean;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  onRemove,
  label = "Clique ou arraste uma imagem",
  hint = `JPG, PNG ou WebP • até ${MAX_SIZE_MB}MB`,
  aspectRatio = "square",
  disabled = false,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectClass = {
    square: "aspect-square",
    cover:  "aspect-video",
    free:   "min-h-32",
  }[aspectRatio];

  function validate(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Formato inválido. Use JPG, PNG ou WebP.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`;
    }
    return null;
  }

  const handleFile = useCallback(
    async (file: File) => {
      const err = validate(file);
      if (err) { setError(err); return; }
      setError(null);
      setUploading(true);
      try {
        await onChange(file);
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  /* Com imagem já carregada */
  if (value) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl", aspectClass, className)}>
        <Image
          src={value}
          alt="Imagem selecionada"
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="bg-white/90"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Trocar"}
          </Button>
          {onRemove && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={onRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={onInputChange}
          disabled={disabled}
        />
      </div>
    );
  }

  /* Zona de upload */
  return (
    <div className={cn("space-y-1.5", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={disabled || uploading}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors",
          aspectClass,
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
          (disabled || uploading) && "pointer-events-none opacity-50"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Enviando...</span>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              {dragging
                ? <Upload className="h-6 w-6 text-primary" />
                : <ImageIcon className="h-6 w-6 text-muted-foreground" />
              }
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          </>
        )}
      </button>

      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />
    </div>
  );
}
