import type { CSSProperties } from "react";

/** Converte #RRGGBB para "H S% L%" — o formato usado pelas variáveis --primary/--secondary (shadcn/Tailwind). */
export function hexToHslString(hex: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** CSS custom properties pra sobrescrever --primary/--secondary só dentro de um restaurante, sem afetar o resto do site. */
export function restaurantThemeStyle(theme: {
  theme_primary: string | null;
  theme_secondary: string | null;
}): CSSProperties {
  const style: Record<string, string> = {};
  const primary = theme.theme_primary ? hexToHslString(theme.theme_primary) : null;
  const secondary = theme.theme_secondary ? hexToHslString(theme.theme_secondary) : null;
  if (primary) style["--primary"] = primary;
  if (secondary) style["--secondary"] = secondary;
  return style as CSSProperties;
}
