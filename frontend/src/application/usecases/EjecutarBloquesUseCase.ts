import type { State, Block } from "../../domain/models/Simulador";

export const ejecutarBloques = (bloques: Block[], state: State): State => {
  let newState = { ...state };

  const executeBlock = (block: Block) => {
    const params = block.params;
    const colorMap: Record<string, string> = {
      red: "#e74c3c",
      blue: "#3498db",
      green: "#2ecc71",
      yellow: "#f1c40f",
      purple: "#9b59b6",
      orange: "#e67e22",
      white: "#ecf0f1",
      cyan: "#00cec9",
    };

    switch (block.type) {
      case "move_forward": {
        const d = parseFloat(params.distance) || 30;
        const rad = (newState.angle * Math.PI) / 180;
        const oldX = newState.x;
        const oldY = newState.y;
        newState.x += Math.cos(rad) * d;
        newState.y += Math.sin(rad) * d;
        newState.x = Math.max(0, Math.min(356, newState.x));
        newState.y = Math.max(0, Math.min(356, newState.y));
        if (newState.trail) {
          newState.trailPoints.push({
            x1: oldX,
            y1: oldY,
            x2: newState.x,
            y2: newState.y,
            color: newState.color,
          });
        }
        break;
      }
      case "move_backward": {
        const d = parseFloat(params.distance) || 30;
        const rad = (newState.angle * Math.PI) / 180;
        const oldX = newState.x;
        const oldY = newState.y;
        newState.x -= Math.cos(rad) * d;
        newState.y -= Math.sin(rad) * d;
        newState.x = Math.max(0, Math.min(356, newState.x));
        newState.y = Math.max(0, Math.min(356, newState.y));
        if (newState.trail) {
          newState.trailPoints.push({
            x1: oldX,
            y1: oldY,
            x2: newState.x,
            y2: newState.y,
            color: newState.color,
          });
        }
        break;
      }
      case "move_up": {
        const d = parseFloat(params.distance) || 30;
        const oldX = newState.x;
        const oldY = newState.y;
        newState.y -= d;
        newState.y = Math.max(0, Math.min(356, newState.y));
        if (newState.trail) {
          newState.trailPoints.push({
            x1: oldX,
            y1: oldY,
            x2: newState.x,
            y2: newState.y,
            color: newState.color,
          });
        }
        break;
      }
      case "move_down": {
        const d = parseFloat(params.distance) || 30;
        const oldX = newState.x;
        const oldY = newState.y;
        newState.y += d;
        newState.y = Math.max(0, Math.min(356, newState.y));
        if (newState.trail) {
          newState.trailPoints.push({
            x1: oldX,
            y1: oldY,
            x2: newState.x,
            y2: newState.y,
            color: newState.color,
          });
        }
        break;
      }
      case "go_to":
        newState.x = 178;
        newState.y = 178;
        break;
      case "turn_right":
        newState.angle += parseFloat(params.angle) || 90;
        newState.angle %= 360;
        break;
      case "turn_left":
        newState.angle -= parseFloat(params.angle) || 90;
        newState.angle = ((newState.angle % 360) + 360) % 360;
        break;
      case "change_color":
        newState.color = colorMap[params.color] || "#e74c3c";
        break;
      case "change_size":
        newState.size = parseFloat(params.size) || 16;
        break;
      case "change_shape":
        newState.shape = params.shape || "circle";
        break;
      case "trail_on":
        newState.trail = true;
        break;
      case "trail_off":
        newState.trail = false;
        break;
      case "play_beep":
        // Lógica para reproducir sonido
        break;
      case "play_drum":
        // Lógica para reproducir sonido
        break;
      case "say":
        newState.speech = params.text || "¡Hola!";
        newState.speechTimer = 60;
        break;
      case "wait":
        // En un entorno real, esto debería manejarse con async/await
        break;
      case "stamp":
        newState.stamps.push({
          x: newState.x,
          y: newState.y,
          color: newState.color,
          size: newState.size,
          shape: newState.shape,
        });
        break;
      case "explode":
        for (let i = 0; i < 20; i++) {
          newState.particles.push({
            x: newState.x,
            y: newState.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 40 + Math.random() * 20,
            color: newState.color,
            size: 2 + Math.random() * 4,
          });
        }
        break;
      case "set_var":
        newState.variable = parseFloat(params.value) || 0;
        break;
      case "change_var":
        newState.variable += parseFloat(params.value) || 1;
        break;
      case "show_var":
        newState.showVar = true;
        break;
      case "repeat": {
        const times = parseInt(params.times) || 1;
        const bodyEnd = findEndBlock(bloques, bloques.indexOf(block) + 1);
        for (let r = 0; r < times; r++) {
          for (let i = bloques.indexOf(block) + 1; i <= bodyEnd; i++) {
            executeBlock(bloques[i]);
          }
        }
        break;
      }
      case "forever": {
        const bodyEnd = findEndBlock(bloques, bloques.indexOf(block) + 1);
        let iteration = 0;
        while (iteration < 100) {
          // Límite de iteraciones para seguridad
          for (let i = bloques.indexOf(block) + 1; i <= bodyEnd; i++) {
            executeBlock(bloques[i]);
          }
          iteration++;
        }
        break;
      }
      case "if_edge": {
        const bodyEnd = findEndBlock(bloques, bloques.indexOf(block) + 1);
        const atEdge =
          newState.x <= newState.size ||
          newState.x >= 356 - newState.size ||
          newState.y <= newState.size ||
          newState.y >= 356 - newState.size;
        if (atEdge) {
          for (let i = bloques.indexOf(block) + 1; i <= bodyEnd; i++) {
            executeBlock(bloques[i]);
          }
        }
        break;
      }
    }
  };

  const findEndBlock = (blocks: Block[], startAfter: number): number => {
    let depth = 1;
    for (let i = startAfter; i < blocks.length; i++) {
      if (["repeat", "forever", "if_edge"].includes(blocks[i].type)) depth++;
      if (blocks[i].type === "end_block") {
        depth--;
        if (depth === 0) return i;
      }
    }
    return blocks.length - 1; // Si no se encuentra el fin, ejecutar hasta el final
  };

  bloques.forEach((block) => {
    executeBlock(block);
  });

  return newState;
};
