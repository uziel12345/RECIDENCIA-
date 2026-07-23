import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { InputProfile } from "../../../hooks/useInputProfile";
import { Icon } from "../../ui/Icons";
import {
  AerialToggleIllustration,
  PanDragIllustration,
  PinchZoomIllustration,
  RotateDragIllustration,
  SearchIllustration,
  TapSelectIllustration,
} from "./gestureIllustrations";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

type TutorialStep = {
  title: string;
  description: string;
  illustration: React.ReactNode;
};

function buildSteps(inputProfile: InputProfile): TutorialStep[] {
  const touch = inputProfile.hasTouch && !inputProfile.hasFinePointer;

  const steps: TutorialStep[] = [
    {
      title: "Rota la vista",
      description: touch
        ? "Arrastra con un dedo sobre el mapa para girar la cámara."
        : "Haz clic izquierdo y arrastra para girar la cámara.",
      illustration: <RotateDragIllustration touch={touch} />,
    },
    {
      title: touch ? "Acerca, aleja y mueve" : "Acerca y aleja",
      description: touch
        ? "Pellizca con dos dedos: júntalos para alejar, sepáralos para acercar. El mismo gesto también mueve el mapa."
        : "Usa la rueda del mouse, o los botones +/- del panel, para hacer zoom.",
      illustration: <PinchZoomIllustration touch={touch} />,
    },
  ];

  if (!touch) {
    steps.push({
      title: "Mueve el mapa",
      description: "Haz clic derecho y arrastra para desplazarte sin girar la cámara.",
      illustration: <PanDragIllustration />,
    });
  }

  steps.push(
    {
      title: "Selecciona un edificio",
      description: touch
        ? "Toca cualquier edificio para ver su información: horarios, aulas, servicios y más."
        : "Haz clic en cualquier edificio para ver su información: horarios, aulas, servicios y más.",
      illustration: <TapSelectIllustration touch={touch} />,
    },
    {
      title: "Busca lo que necesitas",
      description: "Escribe en el buscador para encontrar aulas, laboratorios, departamentos o trámites al instante.",
      illustration: <SearchIllustration />,
    },
    {
      title: "Cambia de vista",
      description: "El botón del mapa alterna entre vista a nivel de calle y vista aérea de todo el campus.",
      illustration: <AerialToggleIllustration />,
    },
  );

  return steps;
}

export function MapTutorialOverlay({
  inputProfile,
  onClose,
}: {
  inputProfile: InputProfile;
  onClose: () => void;
}) {
  const steps = useMemo(() => buildSteps(inputProfile), [inputProfile]);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const isLastStep = stepIndex === steps.length - 1;
  const step = steps[stepIndex];

  const goTo = (nextIndex: number) => {
    setDirection(nextIndex > stepIndex ? 1 : -1);
    setStepIndex(nextIndex);
  };

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      return;
    }
    goTo(stepIndex + 1);
  };

  return (
    <motion.div
      className="map-tutorial-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        display: "grid",
        placeItems: "center",
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial: cómo usar el mapa 3D"
    >
      <motion.div
        className="map-tutorial-card"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.32, ease: EASE_OUT }}
        style={{
          width: "100%",
          maxWidth: 380,
          borderRadius: 24,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 24px 60px rgba(15,23,42,0.35)",
          overflow: "hidden",
          fontFamily: "var(--font-body, 'Public Sans', sans-serif)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar tutorial"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "none",
            background: "rgba(15,23,42,0.06)",
            color: "#475569",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          <Icon name="x" size={16} />
        </button>

        <div
          className="map-tutorial-visual"
          style={{
            height: 150,
            background: "linear-gradient(160deg,#fff7ed 0%,#ffedd5 100%)",
            display: "grid",
            placeItems: "center",
            padding: "0 24px",
          }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              className="map-tutorial-illustration"
              key={stepIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              style={{ width: 120, height: 120 }}
            >
              {step.illustration}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="map-tutorial-content" style={{ padding: "22px 24px 20px" }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -16 }}
              transition={{ duration: 0.26, ease: EASE_OUT }}
            >
              <h2
                style={{
                  margin: "0 0 8px",
                  fontFamily: "var(--font-display, Georgia, serif)",
                  fontSize: 21,
                  fontWeight: 600,
                  color: "#1f2937",
                }}
              >
                {step.title}
              </h2>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "#475569" }}>
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div
            className="map-tutorial-dots"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 6,
              margin: "20px 0 4px",
            }}
          >
            {steps.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir al paso ${i + 1}: ${s.title}`}
                aria-current={i === stepIndex}
                style={{
                  width: i === stepIndex ? 20 : 7,
                  height: 7,
                  borderRadius: 999,
                  border: "none",
                  padding: 0,
                  background: i === stepIndex ? "#ea580c" : "#e2e8f0",
                  transition: "width 0.22s ease, background-color 0.22s ease",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>

          <div
            className="map-tutorial-actions"
            style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                border: "none",
                background: "transparent",
                color: "#64748b",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                padding: "10px 4px",
              }}
            >
              Saltar
            </button>

            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => goTo(stepIndex - 1)}
                aria-label="Paso anterior"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                <Icon name="chevron-left" size={18} />
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              style={{
                marginLeft: stepIndex > 0 ? 0 : "auto",
                border: "none",
                borderRadius: 999,
                padding: "11px 20px",
                background: "linear-gradient(135deg,#ea580c,#c2410c)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(234,88,12,0.32)",
              }}
            >
              {isLastStep ? "Empezar a explorar" : "Siguiente"}
              {!isLastStep && <Icon name="chevron-right" size={16} />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
