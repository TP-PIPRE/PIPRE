// frontend/src/shared/constants/themes.ts

/**
 * Persona-driven color palettes.
 * Principles applied (Impeccable skill):
 *   - Neutrals tinted toward each theme's brand hue
 *   - No pure black (#000) or pure white (#fff)
 *   - 60-30-10 visual weight distribution
 *   - Dark mode uses surface elevation (lighter = higher), not shadows
 *   - Explicit overlay colors instead of heavy alpha usage
 *   - Fonts avoid reflex defaults (Inter, Outfit, IBM Plex, etc.)
 */

const candyHarmonyColors = {
  // Persona: Women in STEM — elegant, warm, confident
  // Brand hue: mauve/plum (hue ~310) — sophisticated, not infantile
  // Borders blend into background — nearly invisible edges
  bg: "#FAF5F8",              // Warm blush off-white
  surface: "#F3ECF0",         // Mauve-tinted linen
  surfaceBrighter: "#FCF8FA", // Elevated blush
  primary: "#9B4D96",         // Rich plum — confident, sophisticated
  primaryLow: "rgba(155, 77, 150, 0.10)",
  primaryGlow: "rgba(155, 77, 150, 0.22)",
  accent: "#C68B3E",          // Warm gold — grounding, luxe
  border: "#F0E8EC",          // Blends into bg — barely visible, soft edge
  text: "#2E1A28",            // Dark aubergine — warm dark, never pure black
  textMuted: "#7D6975",       // Muted mauve-gray
  textInverted: "#FAF5F8",
  robotC1: "#C084D6",          // Lavender — soft gradient base
  robotC2: "#E8B4DE",          // Soft pink — gradient highlight
  success: "#5BA870",
  danger: "#C94F5A",
};

const darkColors = {
  // Persona: Tech enthusiasts & gamers — precise, immersive, high-contrast
  // Brand hue: emerald/teal (hue ~160) — NOT cyan-on-dark AI slop
  // Depth via surface elevation: bg < surface < surfaceBrighter
  bg: "#0C1117",              // Near-black with teal undertone — never pure #000
  surface: "#141C24",         // Elevation 1 — slightly lighter
  surfaceBrighter: "#1C2733", // Elevation 2 — noticeably lifted
  primary: "#34D399",         // Emerald — technical, not neon, not cyan
  primaryLow: "rgba(52, 211, 153, 0.10)",
  primaryGlow: "rgba(52, 211, 153, 0.25)",
  accent: "#F59E0B",          // Warm amber — contrast against cool neutrals
  border: "#1A2430",          // Blends with bg — subtle dark edge
  text: "#E8EDF2",            // Slight blue tint — not pure white
  textMuted: "#6B8299",       // Steel blue-gray — never pure gray
  textInverted: "#0C1117",
  robotC1: "#6CB6FF",          // Blue — tech gradient base
  robotC2: "#34D399",          // Emerald — tech gradient highlight
  success: "#22C55E",
  danger: "#EF4444",
};

const lightColors = {
  // Persona: Educators & professionals — calm, trustworthy, uncluttered
  // Brand hue: indigo (hue ~240) — neutrals tinted warm-cool
  bg: "#F7F8FB",              // Warm paper — tinted toward indigo, not pure white
  surface: "#EEEEF5",         // Indigo-tinted pebble
  surfaceBrighter: "#FAFAFD", // Elevated paper
  primary: "#4F46E5",         // True indigo — confident, not passive slate
  primaryLow: "rgba(79, 70, 229, 0.07)",
  primaryGlow: "rgba(79, 70, 229, 0.14)",
  accent: "#D97706",          // Warm amber — grounding earth tone
  border: "#E6E5F0",         // Blends into bg — soft indigo edge
  text: "#1A1828",            // Near-black tinted toward indigo
  textMuted: "#6E6B80",       // Muted purple-gray — tinted neutral
  textInverted: "#F7F8FB",
  robotC1: "#818CF8",          // Light indigo — calm gradient base
  robotC2: "#4F46E5",          // True indigo — gradient highlight
  success: "#16A34A",
  danger: "#DC2626",
};

export const themes = {
  candyHarmony: {
    name: "Elegance",
    colors: candyHarmonyColors,
    style: "playful",
    borderRadius: "1.25rem",   // Generous but not extreme — 2rem was cartoonish
    fonts: {
      mono: '"Recursive", monospace',      // Variable mono with casual axis
      sans: '"Nunito", system-ui, sans-serif',  // Rounded, warm, kid-friendly
    },
  },
  dark: {
    name: "Tech-Gamer",
    colors: darkColors,
    style: "gamer",
    borderRadius: "6px",       // Sharp but not brutalist — 2px was too raw
    fonts: {
      mono: '"Recursive", monospace',      // Variable mono — crisp at small sizes
      sans: '"Geist", system-ui, sans-serif',   // Sharp, utilitarian, modern
    },
  },
  light: {
    name: "Minimalist",
    colors: lightColors,
    style: "subtle",
    borderRadius: "10px",      // Refined rounding
    fonts: {
      mono: '"Recursive", monospace',
      sans: '"Source Serif 4", Georgia, serif',  // Serif for authority & warmth
    },
  },
};
