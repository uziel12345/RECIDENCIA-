import type { ReactNode } from "react";
import { Icon, type IconName } from "../../../../components/ui/Icons";

type InfoSectionProps = {
  title: string;
  icon: IconName;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
};

export function InfoSection({ title, icon, isEmpty = false, emptyMessage = "", children }: InfoSectionProps) {
  return (
    <div className="ito-building-detail-section flex flex-col gap-1.5">
      <span className="ito-building-detail-section__heading flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
        <Icon name={icon} size={13} />
        {title}
      </span>
      {isEmpty ? (
        <p className="ito-building-detail-section__empty m-0 text-[12.5px] italic text-[var(--color-text-subtle)]">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  );
}
