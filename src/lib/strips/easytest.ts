import type { StripDefinition } from "./types";

// EASYTEST 7-in-1 Pool & Spa test strip.
// Breakpoints and pad order are transcribed directly from the bottle's color
// chart. Swatch hexes are approximations of the printed colors — they are hints
// for the vision model, which also sees the real photo. The CYA "30-50" band is
// represented by its midpoint 40; the strip genuinely cannot resolve finer than
// that, which is exactly why CYA is reported as a range downstream.
export const EASYTEST_7IN1: StripDefinition = {
  id: "easytest-7in1",
  name: "EASYTEST 7-in-1 Pool & Spa",
  pads: [
    {
      key: "totalHardness",
      label: "Total Hardness",
      unit: "ppm",
      breakpoints: [0, 100, 250, 500, 1000],
      swatches: ["#3aa0c8", "#4a6fd0", "#6a5ac0", "#8a4bb0", "#a0338f"],
      role: "actionable",
      okBand: [250, 500],
    },
    {
      key: "freeChlorine",
      label: "Free Chlorine",
      unit: "ppm",
      breakpoints: [0, 0.5, 1, 3, 5, 10],
      swatches: ["#f2eef2", "#efdfe9", "#e6c0d8", "#d69ac2", "#b96aa6", "#8f3f7f"],
      role: "actionable",
      okBand: [1, 3], // the strip's naive band — real target is CYA-adjusted
    },
    {
      key: "bromine",
      label: "Bromine",
      unit: "ppm",
      breakpoints: [0, 1, 2, 6, 10, 20],
      swatches: ["#f2eef2", "#eddbe8", "#e3c2da", "#cf8fbf", "#b062a0", "#7c3a72"],
      role: "informational", // both pools are chlorine; bromine is a sanity check
    },
    {
      key: "totalChlorine",
      label: "Total Chlorine",
      unit: "ppm",
      breakpoints: [0, 0.5, 1, 3, 5, 10],
      swatches: ["#f5f0b0", "#eaf0a0", "#cfe58a", "#9fd06a", "#6bbf55", "#3f9e46"],
      role: "informational", // used with FC to derive combined chlorine (chloramines)
    },
    {
      key: "cya",
      label: "Cyanuric Acid",
      unit: "ppm",
      breakpoints: [0, 40, 100, 150, 240], // printed as 0, 30-50, 100, 150, 240
      swatches: ["#f0a860", "#f0b0a0", "#ef9a95", "#ea7f86", "#d75f74"],
      role: "actionable",
      okBand: [40, 100],
    },
    {
      key: "totalAlkalinity",
      label: "Total Alkalinity",
      unit: "ppm",
      breakpoints: [0, 40, 80, 120, 180, 240],
      swatches: ["#f0eaa8", "#cfe6c0", "#a9e0d0", "#86d6d8", "#66c2dd", "#4aa8d8"],
      role: "actionable",
      okBand: [80, 120],
    },
    {
      key: "ph",
      label: "pH",
      unit: "",
      breakpoints: [6.2, 6.8, 7.2, 7.8, 8.4, 9.0],
      swatches: ["#f2e85a", "#f6c73f", "#f5a83a", "#ef8636", "#e85a34", "#d23b30"],
      role: "actionable",
      okBand: [7.2, 7.8],
    },
  ],
};
