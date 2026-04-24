// frontend/src/shared/constants/themes.ts
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
}

export const THEMES: Record<string, Theme> = {
  claro: {
    name: "claro",
    colors: {
      primary: "#30E3CA",
      secondary: "#11999E",
      background: "#E4F9F5",
      text: "#40514E", // Texto oscuro para fondo claro
      accent: "#E4F9F5",
    },
  },
  oscuro: {
    name: "oscuro",
    colors: {
      primary: "#14FFEC",
      secondary: "#FF6B6B",
      background: "#212121",
      text: "#0D7377", // Nuevo color de texto para tema oscuro (azulado claro)
      accent: "#14FFEC",
    },
  },
  pastel: {
    name: "pastel",
    colors: {
      primary: "#F9B2D7",
      secondary: "#DAF9DE",
      background: "#F6FFDC",
      text: "#3A3A3A", // Texto oscuro para fondo pastel claro
      accent: "#F9B2D7",
    },
  },
};
