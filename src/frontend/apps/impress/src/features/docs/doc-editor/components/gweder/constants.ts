export const CLASSIFICATION_LEVELS = ["PUBLIC", "RESTREINT", "CONFIDENTIEL", "SECRET"] as const;

export type Classification = (typeof CLASSIFICATION_LEVELS)[number];

export const CLASSIFICATION_COLORS: Record<Classification, { bg: string; text: string; border: string }> = {
  PUBLIC: { bg: "#e8f5e9", text: "#2e7d32", border: "#2e7d32" },
  RESTREINT: { bg: "#e3f2fd", text: "#1565c0", border: "#1565c0" },
  CONFIDENTIEL: { bg: "#fff3e0", text: "#e65100", border: "#e65100" },
  SECRET: { bg: "#ffebee", text: "#c62828", border: "#c62828" },
};

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  PUBLIC: "PUBLIC",
  RESTREINT: "RESTREINT",
  CONFIDENTIEL: "CONFID.",
  SECRET: "SECRET",
};

export const DEFAULT_CLASSIFICATION: Classification = "PUBLIC";
