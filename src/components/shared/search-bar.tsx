"use client";

import { useRef, useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  autoFocus?: boolean;
  variant?: "default" | "hero" | "compact";
  className?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Buscar restaurantes ou pratos...",
  loading = false,
  autoFocus = false,
  variant = "default",
  className,
  suggestions,
  onSuggestionClick,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const showSuggestions = focused && suggestions && suggestions.length > 0 && value.length > 0;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      onSearch?.(value);
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      onChange("");
      inputRef.current?.blur();
    }
  }

  const wrapperClass = cn(
    "relative",
    variant === "hero" && "w-full max-w-2xl mx-auto",
    className
  );

  const inputWrapperClass = cn(
    "flex items-center gap-3 rounded-2xl border bg-white transition-all",
    variant === "hero"
      ? "h-14 px-5 shadow-lg"
      : variant === "compact"
      ? "h-9 px-3"
      : "h-12 px-4 shadow-sm",
    focused
      ? "border-primary ring-2 ring-primary/20"
      : "border-border hover:border-primary/40"
  );

  return (
    <div className={wrapperClass}>
      <div className={inputWrapperClass}>
        {/* Ícone de busca / loading */}
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        ) : (
          <Search className={cn("shrink-0 text-muted-foreground", variant === "hero" ? "h-5 w-5" : "h-4 w-4")} />
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground",
            variant === "hero" ? "text-base" : variant === "compact" ? "text-sm" : "text-sm"
          )}
        />

        {/* Limpar */}
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); inputRef.current?.focus(); }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted-foreground/20"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Sugestões */}
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border bg-white shadow-xl animate-nenos-scale-in">
          {suggestions!.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => {
                onChange(s);
                onSuggestionClick?.(s);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/60"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
