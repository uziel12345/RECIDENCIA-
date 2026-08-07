export type SectionTone = "orange" | "violet" | "cyan" | "slate" | "amber";

type ToneClasses = {
  /** Chip cuadrado del ícono en el encabezado de la sección. */
  chip: string;
  /** Tarjeta de cada elemento dentro de la sección (aula, trámite, etc). */
  item: string;
};

const TONE_CLASSES: Record<SectionTone, ToneClasses> = {
  orange: {
    chip: "bg-[var(--tone-orange-bg)] text-[var(--tone-orange-text)]",
    item: "border-[var(--tone-orange-border)] bg-[var(--tone-orange-bg)]",
  },
  violet: {
    chip: "bg-[var(--tone-violet-bg)] text-[var(--tone-violet-text)]",
    item: "border-[var(--tone-violet-border)] bg-[var(--tone-violet-bg)]",
  },
  cyan: {
    chip: "bg-[var(--tone-cyan-bg)] text-[var(--tone-cyan-text)]",
    item: "border-[var(--tone-cyan-border)] bg-[var(--tone-cyan-bg)]",
  },
  slate: {
    chip: "bg-[var(--tone-slate-bg)] text-[var(--tone-slate-text)]",
    item: "border-[var(--tone-slate-border)] bg-[var(--tone-slate-bg)]",
  },
  amber: {
    chip: "bg-[var(--tone-amber-bg)] text-[var(--tone-amber-text)]",
    item: "border-[var(--tone-amber-border)] bg-[var(--tone-amber-bg)]",
  },
};

export function getSectionToneClasses(tone: SectionTone): ToneClasses {
  return TONE_CLASSES[tone];
}
