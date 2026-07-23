import { useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Icon } from "../../../components/ui/Icons";

export type SheetState = "closed" | "full";

type MobileBottomSheetProps = {
  state: SheetState;
  onChangeState: (state: SheetState) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /**
   * Optional sticky header content rendered between the title and the body
   * (for example, a search input or filters). Always visible while the sheet
   * is open in any state.
   */
  stickyHeader?: React.ReactNode;
};

export function MobileBottomSheet({
  state,
  onChangeState,
  title,
  subtitle,
  children,
  stickyHeader,
}: MobileBottomSheetProps) {
  const isOpen = state !== "closed";
  const bodyRef = useRef<HTMLDivElement | null>(null);

  function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    const { offset, velocity } = info;
    const yOffset = offset.y;

    // Swipe/drag down → close
    if (velocity.y > 800 || yOffset > 80) {
      onChangeState("closed");
      return;
    }

    // Strong swipe up → expand
    if (velocity.y < -500 || yOffset < -60) {
      onChangeState("full");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            className="ito-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onChangeState("closed")}
            aria-hidden="true"
          />

          <motion.div
            key="sheet"
            className="ito-sheet ito-sheet--full"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            <button
              type="button"
              className="ito-sheet__handle-tap"
              onClick={() => onChangeState("closed")}
              aria-label="Cerrar panel"
            >
              <span className="ito-sheet__handle-bar" aria-hidden="true" />
            </button>

            <div className="ito-sheet__head">
              <button
                type="button"
                className="ito-sheet__head-text"
                onClick={() => onChangeState("closed")}
              >
                <span className="ito-sheet__title">{title}</span>
                {subtitle && (
                  <span className="ito-sheet__subtitle">{subtitle}</span>
                )}
              </button>

              <div className="ito-sheet__head-actions">
                <button
                  type="button"
                  onClick={() => onChangeState("closed")}
                  className="ito-sheet__icon-btn"
                  aria-label="Cerrar panel"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            </div>

            {stickyHeader && (
              <div className="ito-sheet__sticky">{stickyHeader}</div>
            )}

            <div ref={bodyRef} className="ito-sheet__body">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
