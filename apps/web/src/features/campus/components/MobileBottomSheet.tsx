import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Icon } from "../../../components/ui/Icons";

export type SheetState = "closed" | "peek" | "full";

const PEEK_HEIGHT = 92;

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

  // Reset scroll when going from full → peek so the user always sees the top
  // of the list when they collapse the sheet.
  useEffect(() => {
    if (state === "peek" && bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [state]);

  function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    const { offset, velocity } = info;
    const yOffset = offset.y;

    // Strong swipe down → close
    if (velocity.y > 800 || yOffset > 220) {
      onChangeState("closed");
      return;
    }

    // Drag down a bit → collapse to peek
    if (state === "full" && yOffset > 80) {
      onChangeState("peek");
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
          {state === "full" && (
            <motion.div
              key="backdrop"
              className="ito-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => onChangeState("peek")}
              aria-hidden="true"
            />
          )}

          <motion.div
            key="sheet"
            className={`ito-sheet ito-sheet--${state}`}
            role="dialog"
            aria-modal={state === "full"}
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{
              y: state === "full" ? "0%" : "calc(100% - var(--sheet-peek-height))",
            }}
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
              onClick={() =>
                onChangeState(state === "full" ? "peek" : "full")
              }
              aria-label={
                state === "full" ? "Contraer panel" : "Expandir panel"
              }
            >
              <span className="ito-sheet__handle-bar" aria-hidden="true" />
            </button>

            <div className="ito-sheet__head">
              <button
                type="button"
                className="ito-sheet__head-text"
                onClick={() =>
                  onChangeState(state === "full" ? "peek" : "full")
                }
              >
                <span className="ito-sheet__title">{title}</span>
                {subtitle && (
                  <span className="ito-sheet__subtitle">{subtitle}</span>
                )}
              </button>

              <div className="ito-sheet__head-actions">
                {state === "peek" ? (
                  <button
                    type="button"
                    onClick={() => onChangeState("full")}
                    className="ito-sheet__icon-btn"
                    aria-label="Expandir panel"
                  >
                    <Icon name="chevron-up" size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onChangeState("peek")}
                    className="ito-sheet__icon-btn"
                    aria-label="Contraer panel"
                  >
                    <Icon name="chevron-down" size={18} />
                  </button>
                )}
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
