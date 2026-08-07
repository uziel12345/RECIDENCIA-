import type { ReactNode } from "react";
import { Icon, type IconName } from "../../../../components/ui/Icons";
import { getSectionToneClasses, type SectionTone } from "./section-tone";

type InfoSectionProps = {
  title: string;
  icon: IconName;
  tone: SectionTone;
  count?: number;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
};

export function InfoSection({
  title,
  icon,
  tone,
  count,
  isEmpty = false,
  emptyMessage = "",
  children,
}: InfoSectionProps) {
  const { chip } = getSectionToneClasses(tone);

  return (
    <section className="ito-building-detail-section flex flex-col gap-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3 backdrop-blur-sm">
      <header className="ito-building-detail-section__heading flex items-center gap-2">
        <span
          className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg ${chip}`}
          aria-hidden="true"
        >
          <Icon name={icon} size={14} />
        </span>
        <span className="flex-1 text-[12px] font-bold uppercase tracking-wide text-[var(--color-text)]">
          {title}
        </span>
        {typeof count === "number" && count > 0 && (
          <span className="min-w-5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 py-px text-center text-[10.5px] font-bold text-[var(--color-text-muted)]">
            {count}
          </span>
        )}
      </header>
      {isEmpty ? (
        <p className="m-0 pl-9 text-[12.5px] italic text-[var(--color-text-subtle)]">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  );
}
