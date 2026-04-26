// Conversión de HEX a OKLCH para Candy Harmony
const candyHarmonyColors = {
  bg: "oklch(92% 0.08 350)", // Aproximación de #F8D4E3
  surface: "oklch(90% 0.07 340)", // Aproximación de #E8D0E6
  surfaceBrighter: "oklch(94% 0.06 330)", // Aproximación de #F4E9F0
  primary: "oklch(75% 0.18 320)", // Aproximación de #D699C9
  primaryLow: "oklch(75% 0.18 320 / 0.1)",
  primaryGlow: "oklch(75% 0.18 320 / 0.15)",
  border: "oklch(70% 0.1 310)", // Aproximación de #B399B9
  text: "oklch(20% 0.05 0)", // Aproximación de #333333
  textMuted: "oklch(50% 0.05 0)", // Aproximación de #808080
  textInverted: "oklch(92% 0.08 350)", // Aproximación de #F8D4E3
};

// Conversión de los colores hexadecimales a OKLCH para Dark
const darkColors = {
  bg: "oklch(12% 0.02 240)", // Aproximación de #0E233D
  surface: "oklch(15% 0.02 240)", // Aproximación de #131B28
  surfaceBrighter: "oklch(45% 0.03 200)", // Aproximación de #73858C
  primary: "oklch(35% 0.18 25)", // Aproximación de #721D14
  primaryLow: "oklch(35% 0.18 25 / 0.1)",
  primaryGlow: "oklch(35% 0.18 25 / 0.15)",
  border: "oklch(15% 0.03 30)", // Aproximación de #261611
  text: "oklch(98% 0 0)", // Blanco para contraste
  textMuted: "oklch(70% 0 0)", // Gris claro para texto atenuado
  textInverted: "oklch(12% 0.02 240)", // Aproximación de #0E233D
};

// Conversión de los nuevos colores hexadecimales a OKLCH para Light
const lightColors = {
  bg: "oklch(99% 0.01 240)", // Aproximación de #F9FBFD
  surface: "oklch(98% 0.01 240)", // Aproximación de #ESEAFC (corregido a #E5EAFc)
  surfaceBrighter: "oklch(100% 0 0)", // Aproximación de #FFFFFF
  primary: "oklch(60% 0.15 250)", // Aproximación de #335EEA
  primaryLow: "oklch(60% 0.15 250 / 0.1)",
  primaryGlow: "oklch(60% 0.15 250 / 0.15)",
  border: "oklch(85% 0.02 240)", // Aproximación de #869AB8
  text: "oklch(20% 0 0)", // Negro para contraste
  textMuted: "oklch(40% 0 0)", // Gris para texto atenuado
  textInverted: "oklch(99% 0.01 240)", // Aproximación de #F9FBFD
};

export const themes = {
  candyHarmony: {
    colors: candyHarmonyColors,
    fonts: {
      mono: '"JetBrains Mono", "IBM Plex Mono", monospace',
      sans: '"Inter", system-ui, sans-serif',
    },
  },
  dark: {
    colors: darkColors,
    fonts: {
      mono: '"JetBrains Mono", "IBM Plex Mono", monospace',
      sans: '"Inter", system-ui, sans-serif',
    },
  },
  light: {
    colors: lightColors,
    fonts: {
      mono: '"JetBrains Mono", "IBM Plex Mono", monospace',
      sans: '"Inter", system-ui, sans-serif',
    },
  },
};
