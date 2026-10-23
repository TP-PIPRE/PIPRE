/** PIPRE: semantic palettes for the learning laboratory. Font assets ship locally. */
const fonts = {
  sans: '"Geist Variable", system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Consolas, monospace',
};
export const themes = {
  candyHarmony: {
    name: "Ciruela",
    colors: {
      bg: "#FAF5F8", surface: "#FFFBFD", surfaceBrighter: "#F2E8EF",
      primary: "#873F80", primaryLow: "rgba(135,63,128,.09)", primaryGlow: "rgba(135,63,128,.15)",
      accent: "#925B10", border: "#CDBAC8", text: "#302333", textMuted: "#70576A", textInverted: "#FFFFFF",
      robotC1: "#C084D6", robotC2: "#873F80", success: "#237343", danger: "#B33048",
    },
    style: "playful", borderRadius: "12px", fonts,
  },
  dark: {
    name: "Laboratorio oscuro",
    colors: {
      bg: "#10181F", surface: "#18232D", surfaceBrighter: "#22313E",
      primary: "#5EE0B4", primaryLow: "rgba(94,224,180,.1)", primaryGlow: "rgba(94,224,180,.15)",
      accent: "#F2BC62", border: "#4B6273", text: "#EAF0F5", textMuted: "#A9BBC9", textInverted: "#10251E",
      robotC1: "#6CB6FF", robotC2: "#5EE0B4", success: "#7AE0A4", danger: "#FF9B9B",
    },
    style: "gamer", borderRadius: "10px", fonts,
  },
  light: {
    name: "Laboratorio claro",
    colors: {
      bg: "#F3F6F7", surface: "#FFFFFF", surfaceBrighter: "#EAF0F2",
      primary: "#076D60", primaryLow: "rgba(7,109,96,.08)", primaryGlow: "rgba(7,109,96,.12)",
      accent: "#925B10", border: "#B7C6CC", text: "#182E39", textMuted: "#526873", textInverted: "#FFFFFF",
      robotC1: "#369EAB", robotC2: "#076D60", success: "#237343", danger: "#B33048",
    },
    style: "subtle", borderRadius: "10px", fonts,
  },
};
