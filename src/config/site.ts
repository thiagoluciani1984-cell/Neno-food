export const siteConfig = {
  name: "Nenos Food",
  tagline: "Rápido, fácil e delicioso!",
  description:
    "Seu app de delivery favorito. Peça dos melhores restaurantes da cidade com entrega rápida.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  defaultRestaurantSlug:
    process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_SLUG ?? "lucianis-di-qualita",
} as const;

export type SiteConfig = typeof siteConfig;
