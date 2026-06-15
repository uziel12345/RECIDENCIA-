export type CategoryAccent = {
  fg: string;
  fgDark: string;
  bg: string;
  border: string;
};

const KEYWORD_PALETTE: Array<{ keywords: string[]; accent: CategoryAccent }> = [
  {
    keywords: ["academ", "aula", "edif"],
    accent: { fg: "#ea580c", fgDark: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  },
  {
    keywords: ["lab"],
    accent: { fg: "#0e7490", fgDark: "#155e75", bg: "#cffafe", border: "#a5f3fc" },
  },
  {
    keywords: ["bibl"],
    accent: { fg: "#9a3412", fgDark: "#7c2d12", bg: "#ffedd5", border: "#fed7aa" },
  },
  {
    keywords: ["admin", "rector", "direcc", "ofic"],
    accent: { fg: "#475569", fgDark: "#1e293b", bg: "#e2e8f0", border: "#cbd5e1" },
  },
  {
    keywords: ["depor", "gimn", "cancha"],
    accent: { fg: "#166534", fgDark: "#14532d", bg: "#dcfce7", border: "#bbf7d0" },
  },
  {
    keywords: ["servic", "comed", "cafet", "tienda"],
    accent: { fg: "#b45309", fgDark: "#92400e", bg: "#fef3c7", border: "#fde68a" },
  },
  {
    keywords: ["audit", "evento", "cultu"],
    accent: { fg: "#a21caf", fgDark: "#86198f", bg: "#fae8ff", border: "#f5d0fe" },
  },
  {
    keywords: ["plaza", "areas comunes", "comun", "exterior"],
    accent: { fg: "#0f766e", fgDark: "#115e59", bg: "#ccfbf1", border: "#99f6e4" },
  },
];

const FALLBACK_ACCENT: CategoryAccent = {
  fg: "#ea580c",
  fgDark: "#c2410c",
  bg: "#ffedd5",
  border: "#fed7aa",
};

export function getCategoryAccent(name?: string | null): CategoryAccent {
  if (!name) return FALLBACK_ACCENT;
  const normalized = name.toLowerCase();
  for (const entry of KEYWORD_PALETTE) {
    if (entry.keywords.some((kw) => normalized.includes(kw))) {
      return entry.accent;
    }
  }
  return FALLBACK_ACCENT;
}
