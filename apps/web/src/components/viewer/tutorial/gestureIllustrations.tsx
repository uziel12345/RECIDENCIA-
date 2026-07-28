import { motion } from "framer-motion";

// Ilustraciones animadas y en bucle de cada gesto del mapa 3D. Todas
// comparten el mismo lienzo 120x120 y paleta (naranja de marca + slate)
// para verse como un solo set, no iconos sueltos de distinto estilo.

const STROKE = "#475569";
const BRAND = "#a8442e";
const LOOP = { duration: 1.8, repeat: Infinity, ease: "easeInOut" as const };

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true">
      <rect x="8" y="70" width="104" height="34" rx="10" fill="#f1f5f9" />
      {children}
    </svg>
  );
}

function FingerDot({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="9" fill={BRAND} opacity={0.16} />
      <circle cx={cx} cy={cy} r="5" fill={BRAND} />
    </g>
  );
}

export function RotateDragIllustration({ touch }: { touch: boolean }) {
  return (
    <Stage>
      <motion.rect
        x="38" y="46" width="44" height="30" rx="6"
        fill="none" stroke={STROKE} strokeWidth={2.5}
        animate={{ rotate: [-14, 14, -14] }}
        transition={LOOP}
        style={{ transformOrigin: "60px 61px" }}
      />
      {touch ? (
        <motion.g animate={{ x: [-16, 16, -16] }} transition={LOOP}>
          <FingerDot cx={60} cy={61} />
        </motion.g>
      ) : (
        <motion.g animate={{ x: [-16, 16, -16] }} transition={LOOP}>
          <rect x={53} y={53} width={14} height={18} rx={6} fill="none" stroke={BRAND} strokeWidth={2.5} />
          <line x1={60} y1={53} x2={60} y2={60} stroke={BRAND} strokeWidth={2.5} />
        </motion.g>
      )}
    </Stage>
  );
}

export function PinchZoomIllustration({ touch }: { touch: boolean }) {
  if (!touch) {
    return (
      <Stage>
        <rect x={50} y={40} width={20} height={30} rx={10} fill="none" stroke={STROKE} strokeWidth={2.5} />
        <line x1={60} y1={46} x2={60} y2={56} stroke={STROKE} strokeWidth={2} />
        <motion.g animate={{ y: [0, -6, 0] }} transition={LOOP}>
          <path d="M56 50 L60 44 L64 50" fill="none" stroke={BRAND} strokeWidth={2.5} strokeLinecap="round" />
        </motion.g>
        <motion.g animate={{ y: [0, 6, 0] }} transition={LOOP}>
          <path d="M56 58 L60 64 L64 58" fill="none" stroke={BRAND} strokeWidth={2.5} strokeLinecap="round" />
        </motion.g>
      </Stage>
    );
  }
  return (
    <Stage>
      <motion.g animate={{ x: [-6, -18, -6] }} transition={LOOP}>
        <FingerDot cx={60} cy={55} />
      </motion.g>
      <motion.g animate={{ x: [6, 18, 6] }} transition={LOOP}>
        <FingerDot cx={60} cy={55} />
      </motion.g>
    </Stage>
  );
}

export function PanDragIllustration() {
  return (
    <Stage>
      <motion.g
        animate={{ x: [-14, 14, 14, -14, -14], y: [-8, -8, 8, 8, -8] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x={53} y={45} width={14} height={18} rx={6} fill="none" stroke={BRAND} strokeWidth={2.5} />
        <line x1={60} y1={45} x2={60} y2={52} stroke={BRAND} strokeWidth={2.5} />
        <circle cx={68} cy={48} r={2.4} fill={BRAND} />
      </motion.g>
      <rect x={40} y={64} width={40} height={26} rx={5} fill="none" stroke={STROKE} strokeWidth={2} strokeDasharray="4 3" />
    </Stage>
  );
}

export function TapSelectIllustration({ touch }: { touch: boolean }) {
  return (
    <Stage>
      <rect x={44} y={58} width={32} height={22} rx={3} fill="#eab8a3" stroke={BRAND} strokeWidth={2} />
      <rect x={50} y={64} width={6} height={6} fill="#ffffff" />
      <rect x={64} y={64} width={6} height={6} fill="#ffffff" />
      <motion.g
        animate={{ scale: [1, 0.82, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "60px 55px" }}
      >
        {touch ? (
          <FingerDot cx={60} cy={55} />
        ) : (
          <>
            <rect x={54} y={47} width={12} height={16} rx={6} fill="none" stroke={STROKE} strokeWidth={2.2} />
            <line x1={60} y1={47} x2={60} y2={53} stroke={BRAND} strokeWidth={2.2} />
          </>
        )}
      </motion.g>
      <motion.rect
        x={30} y={18} width={60} height={20} rx={10}
        fill="#ffffff" stroke="#e2e8f0" strokeWidth={1.5}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, 6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </Stage>
  );
}

export function SearchIllustration() {
  return (
    <Stage>
      <rect x={22} y={44} width={76} height={22} rx={11} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1.5} />
      <motion.g
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        <circle cx={78} cy={55} r={5} fill="none" stroke={BRAND} strokeWidth={2.2} />
        <line x1={81.5} y1={58.5} x2={86} y2={63} stroke={BRAND} strokeWidth={2.2} strokeLinecap="round" />
      </motion.g>
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={34 + i * 9}
          cy={55}
          r={2.4}
          fill="#94a3b8"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </Stage>
  );
}

export function AerialToggleIllustration() {
  return (
    <Stage>
      <motion.g
        animate={{ opacity: [1, 1, 0, 0, 1], y: [0, 0, -6, -6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }}
      >
        <rect x={44} y={54} width={14} height={22} fill="none" stroke={STROKE} strokeWidth={2.2} />
        <rect x={62} y={48} width={14} height={28} fill="none" stroke={STROKE} strokeWidth={2.2} />
      </motion.g>
      <motion.g
        animate={{ opacity: [0, 0, 1, 1, 0], y: [6, 6, 0, 0, 6] }}
        transition={{ duration: 2.6, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }}
      >
        <rect x={42} y={56} width={16} height={12} rx={2} fill="none" stroke={BRAND} strokeWidth={2.2} />
        <rect x={62} y={56} width={16} height={12} rx={2} fill="none" stroke={BRAND} strokeWidth={2.2} />
      </motion.g>
    </Stage>
  );
}
