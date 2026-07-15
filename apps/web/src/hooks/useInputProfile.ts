import { useEffect, useState } from "react";

export type InputProfileKind = "phone" | "tablet" | "hybrid" | "desktop";

export type InputProfile = {
  kind: InputProfileKind;
  hasTouch: boolean;
  hasFinePointer: boolean;
  hasHover: boolean;
  hasKeyboard: boolean;
};

function getMatch(query: string) {
  return typeof window !== "undefined" && window.matchMedia(query).matches;
}

function readInputProfile(): InputProfile {
  if (typeof window === "undefined") {
    return {
      kind: "desktop",
      hasTouch: false,
      hasFinePointer: true,
      hasHover: true,
      hasKeyboard: true,
    };
  }

  const hasTouch =
    navigator.maxTouchPoints > 0 ||
    getMatch("(pointer: coarse)") ||
    getMatch("(any-pointer: coarse)");
  const hasFinePointer = getMatch("(pointer: fine)") || getMatch("(any-pointer: fine)");
  const hasHover = getMatch("(hover: hover)") || getMatch("(any-hover: hover)");
  const hasKeyboard = hasFinePointer || hasHover || window.innerWidth >= 900;
  const isTabletWidth = window.innerWidth >= 768;

  let kind: InputProfileKind = "desktop";
  if (hasTouch && hasFinePointer) {
    kind = "hybrid";
  } else if (hasTouch) {
    kind = isTabletWidth ? "tablet" : "phone";
  }

  return {
    kind,
    hasTouch,
    hasFinePointer,
    hasHover,
    hasKeyboard,
  };
}

export function useInputProfile() {
  const [profile, setProfile] = useState(readInputProfile);

  useEffect(() => {
    const queries = [
      "(pointer: coarse)",
      "(pointer: fine)",
      "(hover: hover)",
      "(any-pointer: coarse)",
      "(any-pointer: fine)",
      "(any-hover: hover)",
    ].map((query) => window.matchMedia(query));

    const update = () => setProfile(readInputProfile());

    window.addEventListener("resize", update);
    queries.forEach((query) => query.addEventListener("change", update));

    return () => {
      window.removeEventListener("resize", update);
      queries.forEach((query) => query.removeEventListener("change", update));
    };
  }, []);

  return profile;
}
