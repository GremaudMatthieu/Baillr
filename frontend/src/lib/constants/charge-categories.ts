export const CHARGE_CATEGORY_LABELS: Record<string, string> = {
  water: "Eau",
  electricity: "Électricité",
  teom: "TEOM",
  cleaning: "Nettoyage",
};

export const FIXED_CATEGORIES = [
  "water",
  "electricity",
  "teom",
  "cleaning",
] as const;
