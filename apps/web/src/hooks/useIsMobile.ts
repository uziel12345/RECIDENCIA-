import { useEffect, useState } from "react";

export function shouldUseMobileLayout(
  width: number,
  height: number,
  hasCoarsePointer: boolean,
  breakpoint = 768,
): boolean {
  const isNarrow = width <= breakpoint;
  const isPhoneLandscape =
    hasCoarsePointer && width > height && height <= 600;
  return isNarrow || isPhoneLandscape;
}

function readMobileLayout(breakpoint: number): boolean {
  if (typeof window === "undefined") return false;
  const hasCoarsePointer =
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(any-pointer: coarse)").matches;

  return shouldUseMobileLayout(
    window.innerWidth,
    window.innerHeight,
    hasCoarsePointer,
    breakpoint,
  );
}

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => readMobileLayout(breakpoint));

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const anyCoarsePointer = window.matchMedia("(any-pointer: coarse)");
    const update = () => setIsMobile(readMobileLayout(breakpoint));

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    coarsePointer.addEventListener("change", update);
    anyCoarsePointer.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
      coarsePointer.removeEventListener("change", update);
      anyCoarsePointer.removeEventListener("change", update);
    };
  }, [breakpoint]);

  return isMobile;
}
