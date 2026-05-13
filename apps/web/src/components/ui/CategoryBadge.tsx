import { getCategoryAccent } from "./categoryAccent";

type CategoryBadgeProps = {
  name: string;
  color?: string | null;
  size?: "sm" | "md";
};

export function CategoryBadge({ name, color, size = "md" }: CategoryBadgeProps) {
  const accent = getCategoryAccent(name);
  const fg = color ?? accent.fg;

  return (
    <span
      className={`ito-badge ${size === "sm" ? "ito-badge--sm" : ""}`.trim()}
      style={{
        background: accent.bg,
        color: fg,
        borderColor: accent.border,
      }}
    >
      <span className="ito-badge__dot" aria-hidden="true" />
      {name}
    </span>
  );
}
