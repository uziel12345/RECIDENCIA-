import type { SVGProps } from "react";

export type IconName =
  | "search"
  | "close"
  | "map"
  | "map-pin"
  | "navigation"
  | "route"
  | "building"
  | "compass"
  | "check"
  | "alert"
  | "chevron-right"
  | "chevron-down"
  | "menu"
  | "info"
  | "crosshair"
  | "graduation"
  | "flag"
  | "location"
  | "trash"
  | "layers"
  | "plus"
  | "minus"
  | "home";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  name?: IconName;
};

const baseAttrs = (size: number, props: IconProps) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

const PATHS: Record<IconName, JSX.Element> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  close: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  map: (
    <>
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
      <path d="M9 4v13" />
      <path d="M15 7v13" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  navigation: <polygon points="3 11 22 2 13 21 11 13 3 11" />,
  route: (
    <>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </>
  ),
  building: (
    <>
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  menu: (
    <>
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="22" x2="18" y1="12" y2="12" />
      <line x1="6" x2="2" y1="12" y2="12" />
      <line x1="12" x2="12" y1="6" y2="2" />
      <line x1="12" x2="12" y1="22" y2="18" />
    </>
  ),
  graduation: (
    <>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </>
  ),
  flag: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </>
  ),
  location: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="9" opacity="0.35" />
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </>
  ),
  layers: (
    <>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="M2 12.5l8.58 3.91a2 2 0 0 0 1.66 0L21 12.5" />
      <path d="M2 17.5l8.58 3.91a2 2 0 0 0 1.66 0L21 17.5" />
    </>
  ),
  plus: (
    <>
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
    </>
  ),
  minus: <line x1="5" x2="19" y1="12" y2="12" />,
  home: (
    <>
      <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    </>
  ),
};

export function Icon({ name = "search", size = 18, ...props }: IconProps) {
  return <svg {...baseAttrs(size, props)}>{PATHS[name]}</svg>;
}

// Backwards-compatible named exports (kept for any existing imports).
export const SearchIcon = (p: IconProps) => <Icon name="search" {...p} />;
export const CloseIcon = (p: IconProps) => <Icon name="close" {...p} />;
export const MapPinIcon = (p: IconProps) => <Icon name="map-pin" {...p} />;
export const NavigationIcon = (p: IconProps) => <Icon name="navigation" {...p} />;
export const RouteIcon = (p: IconProps) => <Icon name="route" {...p} />;
export const BuildingIcon = (p: IconProps) => <Icon name="building" {...p} />;
export const CompassIcon = (p: IconProps) => <Icon name="compass" {...p} />;
export const CheckIcon = (p: IconProps) => <Icon name="check" {...p} />;
export const AlertIcon = (p: IconProps) => <Icon name="alert" {...p} />;
export const ChevronRightIcon = (p: IconProps) => <Icon name="chevron-right" {...p} />;
export const ChevronDownIcon = (p: IconProps) => <Icon name="chevron-down" {...p} />;
export const MenuIcon = (p: IconProps) => <Icon name="menu" {...p} />;
export const InfoIcon = (p: IconProps) => <Icon name="info" {...p} />;
export const CrosshairIcon = (p: IconProps) => <Icon name="crosshair" {...p} />;
export const GraduationIcon = (p: IconProps) => <Icon name="graduation" {...p} />;
