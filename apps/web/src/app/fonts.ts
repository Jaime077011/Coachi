import { Anton, Archivo, Badeen_Display, Cairo } from "next/font/google";

// Display: Anton (EN) and Badeen Display (AR). UI: Archivo (EN) and Cairo (AR).
export const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
export const archivo = Archivo({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-archivo",
});
export const cairo = Cairo({ weight: ["400", "600", "700", "800"], subsets: ["arabic", "latin"], variable: "--font-cairo" });
export const badeen = Badeen_Display({
  weight: "400",
  subsets: ["arabic"],
  variable: "--font-badeen",
  adjustFontFallback: false, // no metrics available for Badeen; Cairo is the CSS fallback
});

export const fontVariables = [anton.variable, archivo.variable, cairo.variable, badeen.variable].join(" ");
