export const SYMBOLS = {
  success: "✔",
  error: "✖",
  loading: "⏳",
  deploy: "🚀",
} as const;

export type SymbolKey = keyof typeof SYMBOLS;
