import type { State, Block } from "../../../domain/models/Simulador";

export const inicializarEstado = (): State => ({
  x: 178,
  y: 178,
  angle: 0,
  color: "#e74c3c",
  size: 16,
  shape: "circle",
  trail: false,
  trailPoints: [],
  stamps: [],
  particles: [],
  variable: 0,
  speech: null,
  speechTimer: 0,
  running: false,
  stopRequested: false,
  speed: 1,
  showVar: false,
});

export const parseBlocks = (blocks: HTMLElement[]): Block[] => {
  return blocks.map((block) => {
    const type = block.dataset.type || "";
    const params: Record<string, string> = {};
    block.querySelectorAll("[data-param]").forEach((input) => {
      if (
        input instanceof HTMLInputElement ||
        input instanceof HTMLSelectElement
      ) {
        params[input.dataset.param || ""] = input.value;
      }
    });
    return { type, params };
  });
};
