import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "../../../components/ui/Icons";

interface MobileActionModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function MobileActionModal({
  open,
  title,
  children,
  onClose,
}: MobileActionModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="campus-mobile-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className="campus-mobile-modal__panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="campus-mobile-modal__handle" aria-hidden="true" />

            <div className="campus-mobile-modal__header">
              <h2>{title}</h2>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ventana"
                className="campus-mobile-modal__close"
              >
                <XIcon size={22} />
              </button>
            </div>

            <div className="campus-mobile-modal__body">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
