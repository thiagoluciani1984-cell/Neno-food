/**
 * Fotos de cardápio mantidas no próprio app.
 *
 * O mapa é intencionalmente explícito: só substitui itens que ainda usam
 * placeholders ilustrados no banco. Produtos que já têm fotografia real
 * continuam usando `image_url` normalmente.
 */
const MENU_IMAGE_OVERRIDES: Readonly<Record<string, string>> = {
  "pdp-coca-lata-350": "/menu/shared/cola.webp",
  "pdp-coca-zero-lata-350": "/menu/shared/cola.webp",
  "pdp-guarana-lata-350": "/menu/shared/guarana.webp",
  "pdp-guarana-zero-lata-350": "/menu/shared/guarana.webp",
  "pdp-sprite-lata-350": "/menu/shared/limao.webp",
  "pdp-fanta-lata-350": "/menu/shared/laranja.webp",
  "pdp-coca-zero-garrafa-1l": "/menu/shared/cola.webp",
  "pdp-guarana-garrafa-1l": "/menu/shared/guarana.webp",
  "pdp-fanta-garrafa-1l": "/menu/shared/laranja.webp",
  "pdp-h2oh-garrafa-1l": "/menu/shared/limao.webp",
  "pdp-coca-garrafa-2l": "/menu/shared/cola.webp",
  "pdp-coca-zero-garrafa-2l": "/menu/shared/cola.webp",
  "pdp-guarana-garrafa-2l": "/menu/shared/guarana.webp",
  "pdp-kuat-garrafa-2l": "/menu/shared/guarana.webp",
  "pdp-agua-com-gas-500": "/menu/shared/agua-com-gas.webp",
  "lasanha-5-queijos": "/menu/lucianis/lasanha-5-queijos.webp",
  "parmegiana-frango": "/menu/lucianis/parmegiana-frango.webp",
  "parmegiana-file-mignon": "/menu/lucianis/parmegiana-file-mignon.webp",
  "risoto-tilapia": "/menu/lucianis/risoto-tilapia.webp",
  "coca-zero-lata-350": "/menu/shared/cola.webp",
  "sprite-lata-350": "/menu/shared/limao.webp",
  "guarana-lata-350": "/menu/shared/guarana.webp",
  "fanta-lata-350": "/menu/shared/laranja.webp",
  "coca-zero-garrafa-1l": "/menu/shared/cola.webp",
  "fanta-garrafa-1l": "/menu/shared/laranja.webp",
  "h2oh-garrafa-1l": "/menu/shared/limao.webp",
  "agua-com-gas-500": "/menu/shared/agua-com-gas.webp",
  "h2oh-500": "/menu/shared/limao.webp",
};

export function resolveMenuImage(slug: string, imageUrl: string | null): string | null {
  return MENU_IMAGE_OVERRIDES[slug] ?? imageUrl;
}
