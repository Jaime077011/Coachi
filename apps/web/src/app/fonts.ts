import { Anton, Archivo, Cairo } from "next/font/google";

// Display: Anton (EN) and Cairo ExtraBold (AR; Badeen Display was hard to read). UI: Archivo (EN) and Cairo (AR).
export const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
export const archivo = Archivo({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-archivo",
});
export const cairo = Cairo({ weight: ["400", "600", "700", "800"], subsets: ["arabic", "latin"], variable: "--font-cairo" });

export const fontVariables = [anton.variable, archivo.variable, cairo.variable].join(" ");
