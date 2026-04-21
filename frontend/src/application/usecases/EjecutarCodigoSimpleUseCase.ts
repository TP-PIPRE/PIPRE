import type { State } from "../../domain/models/Simulador";

const comandosPCIN = [
  {
    regex: /avanzar\s+(\d+)/i,
    action: (state: State, match: RegExpMatchArray) => {
      const d = parseFloat(match[1]) || 30;
      const rad = (state.angle * Math.PI) / 180;
      const oldX = state.x;
      const oldY = state.y;
      state.x += Math.cos(rad) * d;
      state.y += Math.sin(rad) * d;
      state.x = Math.max(0, Math.min(356, state.x));
      state.y = Math.max(0, Math.min(356, state.y));
      if (state.trail) {
        state.trailPoints.push({
          x1: oldX,
          y1: oldY,
          x2: state.x,
          y2: state.y,
          color: state.color,
        });
      }
    },
  },
  {
    regex: /girar\s+(derecha|izquierda)\s+(\d+)/i,
    action: (state: State, match: RegExpMatchArray) => {
      const angle = parseFloat(match[2]) || 90;
      if (match[1] === "derecha") {
        state.angle += angle;
      } else {
        state.angle -= angle;
      }
      state.angle = ((state.angle % 360) + 360) % 360;
    },
  },
  {
    regex: /color\s+(\w+)/i,
    action: (state: State, match: RegExpMatchArray) => {
      const colorMap: Record<string, string> = {
        rojo: "#e74c3c",
        azul: "#3498db",
        verde: "#2ecc71",
        amarillo: "#f1c40f",
        morado: "#9b59b6",
        naranja: "#e67e22",
        blanco: "#ecf0f1",
        cyan: "#00cec9",
      };
      const color = match[1].toLowerCase();
      state.color = colorMap[color] || "#e74c3c";
    },
  },
  {
    regex: /tamano\s+(\d+)/i,
    action: (state: State, match: RegExpMatchArray) => {
      const size = parseFloat(match[1]) || 16;
      state.size = size;
    },
  },
  {
    regex: /rastro\s+(activar|desactivar)/i,
    action: (state: State, match: RegExpMatchArray) => {
      state.trail = match[1] === "activar";
    },
  },
  {
    regex: /decir\s+["'](.+)["']/i,
    action: (state: State, match: RegExpMatchArray) => {
      state.speech = match[1];
      state.speechTimer = 60;
    },
  },
  {
    regex: /esperar\s+(\d+)/i,
    action: (state: State, match: RegExpMatchArray) => {
      // En un entorno real, esto debería manejarse con async/await
    },
  },
  {
    regex: /variable\s+=\s+(\d+)/i,
    action: (state: State, match: RegExpMatchArray) => {
      const value = parseFloat(match[1]) || 0;
      state.variable = value;
    },
  },
  {
    regex: /variable\s+\+\s+(\d+)/i,
    action: (state: State, match: RegExpMatchArray) => {
      const value = parseFloat(match[1]) || 1;
      state.variable += value;
    },
  },
  {
    regex: /mostrar\s+variable/i,
    action: (state: State) => {
      state.showVar = true;
    },
  },
];

export const ejecutarCodigoSimple = (codigo: string, state: State): State => {
  const newState = { ...state };
  const lineas = codigo.split("\n");

  lineas.forEach((linea) => {
    linea = linea.trim();
    if (!linea || linea.startsWith("//")) return;

    comandosPCIN.forEach((comando) => {
      const match = linea.match(comando.regex);
      if (match) {
        comando.action(newState, match);
      }
    });
  });

  return newState;
};
