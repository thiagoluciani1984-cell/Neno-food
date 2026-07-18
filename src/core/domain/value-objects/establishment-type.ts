export const ESTABLISHMENT_TYPES = [
  "restaurant",
  "bar",
  "bakery",
  "pizzeria",
  "hamburger",
  "japanese",
  "italian",
  "fast_food",
  "cafe",
  "other",
] as const;

export type EstablishmentType = (typeof ESTABLISHMENT_TYPES)[number];

export const ESTABLISHMENT_TYPE_OPTIONS: { value: EstablishmentType; label: string }[] = [
  { value: "restaurant", label: "Restaurante" },
  { value: "pizzeria", label: "Pizzaria" },
  { value: "hamburger", label: "Hamburgueria" },
  { value: "japanese", label: "Japonês / Sushi" },
  { value: "italian", label: "Italiano" },
  { value: "bakery", label: "Padaria / Confeitaria" },
  { value: "bar", label: "Bar / Petiscaria" },
  { value: "cafe", label: "Café" },
  { value: "fast_food", label: "Fast Food" },
  { value: "other", label: "Outro" },
];
