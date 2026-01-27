import type { CatalogExtra } from "../types";

// ✅ NUEVO: Catálogo de extras con precios por uña
export const EXTRAS_CATALOG: CatalogExtra[] = [
  {
    id: "aurora_glaseado",
    name: "Efecto Aurora/ glaseado",
    priceSuggested: 0.3,
    appliesToCategories: ["manicura", "pedicura"],
    active: true,
  },
  {
    id: "espejo_diseño",
    name: "Efecto espejo diseño",
    priceSuggested: 0.3,
    appliesToCategories: ["manicura", "pedicura"],
    active: true,
  },
  {
    id: "espejo_complete",
    name: "Efecto espejo complete",
    priceSuggested: 0.3,
    appliesToCategories: ["manicura", "pedicura"],
    active: true,
  },
  {
    id: "relieve_1",
    name: "Relieve 1",
    priceSuggested: 0.3,
    appliesToCategories: ["manicura", "pedicura"],
    active: true,
  },
  {
    id: "relieve_2",
    name: "Relieve 2",
    priceSuggested: 0.5,
    appliesToCategories: ["manicura", "pedicura"],
    active: true,
  },
  {
    id: "flor_3d",
    name: "Flor 3D",
    priceSuggested: 0.5,
    appliesToCategories: ["manicura", "pedicura"],
    active: true,
  },
  {
    id: "mano_alzada",
    name: "Mano alzada",
    priceSuggested: 0.5,
    appliesToCategories: ["manicura", "pedicura"],
    active: true,
  },
  {
    id: "aurora",
    name: "Efecto Aurora",
    priceSuggested: 0.5,
    appliesToCategories: ["manicura", "pedicura"],
    active: true,
  },
  {
    id: "blooming",
    name: "Blooming",
    priceSuggested: 0.5,
    appliesToCategories: ["manicura", "pedicura"],
    active: true,
  },
  {
    id: "esponja",
    name: "Esponja",
    priceSuggested: 0.5,
    appliesToCategories: ["manicura", "pedicura"],
    active: true,
  },
  {
    id: "reconstruccion",
    name: "Reconstrucción",
    priceSuggested: 2.5,
    appliesToCategories: ["manicura", "pedicura"],
    active: true,
  },
];

// ✅ NUEVO: Costos fijos de recetas por categoría
export const RECIPE_COSTS = {
  manicura: 0.33,
  pedicura: 0.5,
  "Manicura completa": 0.33,
  "Pedicura completa": 0.5,
};
