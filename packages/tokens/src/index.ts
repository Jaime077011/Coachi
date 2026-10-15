/**
 * Coachi brand tokens — the single source of truth for colors, sizes, and fonts.
 * Values come from "Coachi Brand Guidelines" and the shadcn mapping in "Coachi UI Spec".
 * The web app reads them through theme.css; the Expo app (month two) will feed them to NativeWind.
 */

export const palette = {
  ink: "#040814",
  navy: "#121C30",
  cream: "#F4EFE6",
  white: "#FDFDFD",
  fireRed: "#F2412E",
  ember: "#FF5A3A",
  deepRed: "#C8141E",
} as const;

export const fireGradient = ["#FF7A45", "#F2412E", "#C8141E"] as const;

type ThemeColors = {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryForeground: string;
  primaryHover: string;
  secondary: string;
  mutedForeground: string;
  hint: string;
  disabled: string;
  destructive: string;
  border: string;
  ring: string;
  success: string;
  warning: string;
  info: string;
  chart: readonly [string, string, string, string, string];
};

export const colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: "#F4EFE6",
    foreground: "#040814",
    card: "#FDFDFD",
    primary: "#C8141E",
    primaryForeground: "#FDFDFD",
    primaryHover: "#A8101A",
    secondary: "#EAE3D6",
    mutedForeground: "#4A5468",
    hint: "#646C7E",
    disabled: "#9AA1AE",
    destructive: "#A3124F",
    border: "#DDD4C4",
    ring: "#C8141E",
    success: "#15803D",
    warning: "#B45309",
    info: "#1D5FD1",
    chart: ["#F2412E", "#1D5FD1", "#15803D", "#B45309", "#4A5468"],
  },
  dark: {
    background: "#040814",
    foreground: "#F4EFE6",
    card: "#121C30",
    primary: "#FF5A3A",
    primaryForeground: "#040814",
    primaryHover: "#FF7A45",
    secondary: "#1B2740",
    mutedForeground: "#A9B1C2",
    hint: "#7C869B",
    disabled: "#4A5468",
    destructive: "#FF7AA2",
    border: "#26324D",
    ring: "#FF7A45",
    success: "#2BC48A",
    warning: "#FDB022",
    info: "#5EA8FF",
    chart: ["#F2412E", "#5EA8FF", "#2BC48A", "#FDB022", "#A9B1C2"],
  },
};

/** 4 px grid. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 } as const;

export const breakpoints = { tablet: 768, desktop: 1024 } as const;

/** Minimum tap target and main button height, in px. */
export const touch = { minTarget: 44, mainButton: 48, bigCta: 56, tabBar: 64 } as const;
