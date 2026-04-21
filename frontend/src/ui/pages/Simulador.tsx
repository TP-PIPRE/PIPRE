import React, { useState, useEffect, useRef } from "react";
import {
  FaPlay,
  FaStop,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { ejecutarBloques } from "../../application/usecases/EjecutarBloquesUseCase";
import { ejecutarCodigoSimple } from "../../application/usecases/EjecutarCodigoSimpleUseCase";
import type { Block, State } from "../../domain/models/Simulador";

export const Simulador = () => {
  const [modo, setModo] = useState<"bloques" | "codigo">("bloques");
  const [codigoSimple, setCodigoSimple] = useState("");
  const [bloques, setBloques] = useState<Block[]>([]);
  const [state, setState] = useState<State>({
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
  const [consoleLogs, setConsoleLogs] = useState<
    { time: string; msg: string; type: string }[]
  >([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  let blockIdCounter = useRef(0);

  const log = (msg: string, type: string = "info") => {
    const t = new Date().toLocaleTimeString();
    setConsoleLogs((prevLogs) => [...prevLogs, { time: `[${t}]`, msg, type }]);
  };

  const cambiarModo = () => {
    setModo(modo === "bloques" ? "codigo" : "bloques");
  };

  const addBlockToWorkspace = (
    type: string,
    params: Record<string, string> = {},
  ) => {
    const emptyMsg = document.getElementById("emptyMsg");
    if (emptyMsg) emptyMsg.style.display = "none";

    const block = document.createElement("div");
    block.className = `block ${getBlockClass(type)}`;
    block.dataset.type = type;
    block.dataset.id = String(blockIdCounter.current++);
    block.innerHTML = buildBlockHTML(type, params);

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.innerHTML = "✕";
    delBtn.onclick = () => {
      block.remove();
      updateBlockCount();
      if (
        workspaceRef.current?.querySelectorAll(".block").length === 0 &&
        emptyMsg
      ) {
        emptyMsg.style.display = "";
      }
    };
    block.appendChild(delBtn);

    enableWorkspaceDrag(block);
    if (workspaceRef.current) {
      workspaceRef.current.appendChild(block);
    }
    updateBlockCount();
  };

  const getBlockClass = (type: string) => {
    if (
      [
        "move_forward",
        "move_backward",
        "move_up",
        "move_down",
        "go_to",
      ].includes(type)
    )
      return "block-move";
    if (["turn_right", "turn_left"].includes(type)) return "block-turn";
    if (
      [
        "change_color",
        "change_size",
        "change_shape",
        "trail_on",
        "trail_off",
      ].includes(type)
    )
      return "block-look";
    if (["play_beep", "play_drum"].includes(type)) return "block-sound";
    if (["say", "wait", "stamp", "explode"].includes(type))
      return "block-action";
    if (["repeat", "forever", "if_edge", "end_block"].includes(type))
      return "block-control";
    if (["set_var", "change_var", "show_var"].includes(type))
      return "block-variable";
    return "";
  };

  const buildBlockHTML = (
    type: string,
    params: Record<string, string> = {},
  ) => {
    const p = params || {};
    const templates: Record<string, string> = {
      move_forward: `
        <span class="icon">➡️</span>
        Avanzar <input type="number" value="${p.distance || 30}" data-param="distance" min="1" max="200" style="width:50px"> px
      `,
      move_backward: `
        <span class="icon">⬅️</span>
        Retroceder <input type="number" value="${p.distance || 30}" data-param="distance" min="1" max="200" style="width:50px"> px
      `,
      move_up: `
        <span class="icon">⬆️</span>
        Subir <input type="number" value="${p.distance || 30}" data-param="distance" min="1" max="200" style="width:50px"> px
      `,
      move_down: `
        <span class="icon">⬇️</span>
        Bajar <input type="number" value="${p.distance || 30}" data-param="distance" min="1" max="200" style="width:50px"> px
      `,
      go_to: `
        <span class="icon">📍</span>
        Ir a centro
      `,
      turn_right: `
        <span class="icon">↩️</span>
        Girar ↻ <input type="number" value="${p.angle || 90}" data-param="angle" min="1" max="360" style="width:50px">°
      `,
      turn_left: `
        <span class="icon">↪️</span>
        Girar ↺ <input type="number" value="${p.angle || 90}" data-param="angle" min="1" max="360" style="width:50px">°
      `,
      change_color: `
        <span class="icon">🎨</span>
        Color
        <select data-param="color">
          <option value="red" ${p.color === "red" ? "selected" : ""}>Rojo</option>
          <option value="blue" ${p.color === "blue" ? "selected" : ""}>Azul</option>
          <option value="green" ${p.color === "green" ? "selected" : ""}>Verde</option>
          <option value="yellow" ${p.color === "yellow" ? "selected" : ""}>Amarillo</option>
          <option value="purple" ${p.color === "purple" ? "selected" : ""}>Morado</option>
          <option value="orange" ${p.color === "orange" ? "selected" : ""}>Naranja</option>
          <option value="white" ${p.color === "white" ? "selected" : ""}>Blanco</option>
          <option value="cyan" ${p.color === "cyan" ? "selected" : ""}>Cian</option>
        </select>
      `,
      change_size: `
        <span class="icon">🔍</span>
        Tamaño <input type="number" value="${p.size || 20}" data-param="size" min="5" max="80" style="width:50px"> px
      `,
      change_shape: `
        <span class="icon">🔷</span>
        Forma
        <select data-param="shape">
          <option value="circle" ${p.shape === "circle" ? "selected" : ""}>Círculo</option>
          <option value="square" ${p.shape === "square" ? "selected" : ""}>Cuadrado</option>
          <option value="triangle" ${p.shape === "triangle" ? "selected" : ""}>Triángulo</option>
          <option value="star" ${p.shape === "star" ? "selected" : ""}>Estrella</option>
          <option value="diamond" ${p.shape === "diamond" ? "selected" : ""}>Diamante</option>
        </select>
      `,
      trail_on: `
        <span class="icon">✏️</span>
        Activar rastro
      `,
      trail_off: `
        <span class="icon">🚫</span>
        Desactivar rastro
      `,
      play_beep: `
        <span class="icon">🔔</span>
        Beep
        <select data-param="note">
          <option value="C" ${p.note === "C" ? "selected" : ""}>Do</option>
          <option value="D" ${p.note === "D" ? "selected" : ""}>Re</option>
          <option value="E" ${p.note === "E" ? "selected" : ""}>Mi</option>
          <option value="F" ${p.note === "F" ? "selected" : ""}>Fa</option>
          <option value="G" ${p.note === "G" ? "selected" : ""}>Sol</option>
          <option value="A" ${p.note === "A" ? "selected" : ""}>La</option>
          <option value="B" ${p.note === "B" ? "selected" : ""}>Si</option>
        </select>
      `,
      play_drum: `
        <span class="icon">🥁</span>
        Tambor
      `,
      say: `
        <span class="icon">💬</span>
        Decir <input type="text" value="${p.text || "¡Hola!"}" data-param="text" style="width:70px">
      `,
      wait: `
        <span class="icon">⏳</span>
        Esperar <input type="number" value="${p.seconds || 1}" data-param="seconds" min="0.1" max="10" step="0.1" style="width:50px"> seg
      `,
      stamp: `
        <span class="icon">🖨️</span>
        Estampar
      `,
      explode: `
        <span class="icon">💥</span>
        Explotar partículas
      `,
      repeat: `
        <span class="icon">🔁</span>
        Repetir <input type="number" value="${p.times || 4}" data-param="times" min="1" max="100" style="width:50px"> veces
      `,
      forever: `
        <span class="icon">♾️</span>
        Por siempre
      `,
      if_edge: `
        <span class="icon">🧱</span>
        Si toca borde
      `,
      end_block: `
        <span class="icon">🔚</span>
        Fin de bloque
      `,
      set_var: `
        <span class="icon">📝</span>
        Variable = <input type="number" value="${p.value || 0}" data-param="value" style="width:40px">
      `,
      change_var: `
        <span class="icon">➕</span>
        Variable + <input type="number" value="${p.value || 1}" data-param="value" style="width:40px">
      `,
      show_var: `
        <span class="icon">👁️</span>
        Mostrar variable
      `,
    };
    return templates[type] || type;
  };

  const updateBlockCount = () => {
    const count = workspaceRef.current?.querySelectorAll(".block").length || 0;
    const blockCountElement = document.getElementById("blockCount");
    if (blockCountElement) {
      blockCountElement.textContent = `${count} bloque${count !== 1 ? "s" : ""}`;
    }
  };

  const enableWorkspaceDrag = (blockEl: HTMLElement) => {
    blockEl.setAttribute("draggable", "true");
    blockEl.addEventListener("dragstart", (e: any) => {
      const type = blockEl.dataset.type;
      const params: Record<string, string> = {};
      blockEl.querySelectorAll("[data-param]").forEach((inp: any) => {
        params[inp.dataset.param] = inp.value;
      });
      const dragData = { type, params, source: "workspace", element: blockEl };
      e.dataTransfer?.setData("text/plain", JSON.stringify(dragData));
      setTimeout(() => (blockEl.style.opacity = "0.3"), 0);
    });
    blockEl.addEventListener("dragend", () => {
      blockEl.style.opacity = "1";
    });
  };

  const runProgram = async () => {
    if (state.running) return;

    const program = parseBlocks();
    if (program.length === 0) {
      log("⚠️ No hay bloques en el área de código", "warn");
      return;
    }

    setState((prevState) => ({
      ...prevState,
      running: true,
      stopRequested: false,
    }));
    const runBtn = document.getElementById("runBtn");
    if (runBtn) {
      runBtn.classList.add("running");
      runBtn.innerHTML = "⏸ Ejecutando...";
    }
    const stageStatus = document.getElementById("stageStatus");
    if (stageStatus) {
      stageStatus.textContent = "Ejecutando...";
    }

    // Reset
    const newState = {
      ...state,
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
      showVar: false,
    };
    setState(newState);
    log("▶ Programa iniciado", "success");

    try {
      await executeInstructions(program, 0, program.length);
    } catch (e: any) {
      if (e.message !== "STOPPED") log("❌ Error: " + e.message, "error");
    }

    finishExecution();
  };

  const parseBlocks = () => {
    const blocks = workspaceRef.current?.querySelectorAll(".block") || [];
    const program: {
      type: string;
      params: Record<string, string>;
      element: HTMLElement;
    }[] = [];
    blocks.forEach((b: any) => {
      const type = b.dataset.type;
      const params: Record<string, string> = {};
      b.querySelectorAll("[data-param]").forEach((inp: any) => {
        params[inp.dataset.param] = inp.value;
      });
      program.push({ type, params, element: b });
    });
    return program;
  };

  const executeInstructions = async (
    program: any[],
    start: number,
    end: number,
  ) => {
    let i = start;
    while (i < end && !state.stopRequested) {
      const instr = program[i];

      // Handle control structures
      if (instr.type === "repeat") {
        const times = parseInt(instr.params.times) || 1;
        const bodyEnd = findEndBlock(program, i + 1);
        for (let r = 0; r < times && !state.stopRequested; r++) {
          highlightBlock(instr.element);
          log(`🔁 Repetición ${r + 1}/${times}`, "info");
          await executeInstructions(program, i + 1, bodyEnd);
        }
        i = bodyEnd + 1;
        continue;
      }

      if (instr.type === "forever") {
        const bodyEnd = findEndBlock(program, i + 1);
        let iteration = 0;
        while (!state.stopRequested) {
          highlightBlock(instr.element);
          iteration++;
          if (iteration % 50 === 0) log(`♾️ Iteración ${iteration}`, "info");
          await executeInstructions(program, i + 1, bodyEnd);
        }
        i = bodyEnd + 1;
        continue;
      }

      if (instr.type === "if_edge") {
        const bodyEnd = findEndBlock(program, i + 1);
        highlightBlock(instr.element);
        const atEdge =
          state.x <= state.size ||
          state.x >= 356 - state.size ||
          state.y <= state.size ||
          state.y >= 356 - state.size;
        if (atEdge) {
          log("🧱 ¡Tocando borde! Ejecutando bloque...", "warn");
          await executeInstructions(program, i + 1, bodyEnd);
        }
        i = bodyEnd + 1;
        continue;
      }

      if (instr.type === "end_block") {
        i++;
        continue;
      }

      // Regular block
      highlightBlock(instr.element);
      await executeBlock(instr);
      await delay(300 / state.speed);
      unhighlightBlock(instr.element);
      i++;
    }

    if (state.stopRequested) throw new Error("STOPPED");
  };

  const findEndBlock = (program: any[], startAfter: number) => {
    let depth = 1;
    for (let i = startAfter; i < program.length; i++) {
      if (["repeat", "forever", "if_edge"].includes(program[i].type)) depth++;
      if (program[i].type === "end_block") {
        depth--;
        if (depth === 0) return i;
      }
    }
    return program.length; // No end found, run to end
  };

  const executeBlock = async (instr: any) => {
    const p = instr.params;
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

    switch (instr.type) {
      case "move_forward": {
        const d = parseFloat(p.distance) || 30;
        const rad = (state.angle * Math.PI) / 180;
        const oldX = state.x,
          oldY = state.y;
        setState((prevState) => {
          const newState = { ...prevState };
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
          return newState;
        });
        log(
          `➡️ Avanzar ${d}px → (${Math.round(state.x)}, ${Math.round(state.y)})`,
        );
        break;
      }
      case "move_backward": {
        const d = parseFloat(p.distance) || 30;
        const rad = (state.angle * Math.PI) / 180;
        const oldX = state.x,
          oldY = state.y;
        setState((prevState) => {
          const newState = { ...prevState };
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
          return newState;
        });
        log(
          `⬅️ Retroceder ${d}px → (${Math.round(state.x)}, ${Math.round(state.y)})`,
        );
        break;
      }
      case "move_up": {
        const d = parseFloat(p.distance) || 30;
        const oldX = state.x,
          oldY = state.y;
        setState((prevState) => {
          const newState = { ...prevState };
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
          return newState;
        });
        log(`⬆️ Subir ${d}px → Y:${Math.round(state.y)}`);
        break;
      }
      case "move_down": {
        const d = parseFloat(p.distance) || 30;
        const oldX = state.x,
          oldY = state.y;
        setState((prevState) => {
          const newState = { ...prevState };
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
          return newState;
        });
        log(`⬇️ Bajar ${d}px → Y:${Math.round(state.y)}`);
        break;
      }
      case "go_to":
        setState((prevState) => ({ ...prevState, x: 178, y: 178 }));
        log("📍 Ir a centro");
        break;
      case "turn_right":
        setState((prevState) => {
          const newState = { ...prevState };
          newState.angle += parseFloat(p.angle) || 90;
          newState.angle %= 360;
          return newState;
        });
        log(`↩️ Girar derecha ${p.angle}° → ${Math.round(state.angle)}°`);
        break;
      case "turn_left":
        setState((prevState) => {
          const newState = { ...prevState };
          newState.angle -= parseFloat(p.angle) || 90;
          newState.angle = ((newState.angle % 360) + 360) % 360;
          return newState;
        });
        log(`↪️ Girar izquierda ${p.angle}° → ${Math.round(state.angle)}°`);
        break;
      case "change_color":
        setState((prevState) => ({
          ...prevState,
          color: colorMap[p.color] || "#e74c3c",
        }));
        log(`🎨 Color → ${p.color}`);
        break;
      case "change_size":
        setState((prevState) => ({
          ...prevState,
          size: parseFloat(p.size) || 16,
        }));
        log(`🔍 Tamaño → ${state.size}px`);
        break;
      case "change_shape":
        setState((prevState) => ({ ...prevState, shape: p.shape || "circle" }));
        log(`🔷 Forma → ${state.shape}`);
        break;
      case "trail_on":
        setState((prevState) => ({ ...prevState, trail: true }));
        log("✏️ Rastro activado", "success");
        break;
      case "trail_off":
        setState((prevState) => ({ ...prevState, trail: false }));
        log("🚫 Rastro desactivado");
        break;
      case "play_beep":
        log(`🔔 Beep (${p.note || "C"})`);
        break;
      case "play_drum":
        log("🥁 Tambor");
        break;
      case "say":
        setState((prevState) => ({
          ...prevState,
          speech: p.text || "¡Hola!",
          speechTimer: 60,
        }));
        log(`💬 "${p.text || "¡Hola!"}"`);
        break;
      case "wait": {
        const secs = parseFloat(p.seconds) || 1;
        log(`⏳ Esperando ${secs}s...`);
        await delay((secs * 1000) / state.speed);
        break;
      }
      case "stamp":
        setState((prevState) => ({
          ...prevState,
          stamps: [
            ...prevState.stamps,
            {
              x: prevState.x,
              y: prevState.y,
              color: prevState.color,
              size: prevState.size,
              shape: prevState.shape,
            },
          ],
        }));
        log("🖨️ Estampado");
        break;
      case "explode":
        setState((prevState) => {
          const newState = { ...prevState };
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
          return newState;
        });
        log("💥 ¡Explosión de partículas!", "warn");
        break;
      case "set_var":
        setState((prevState) => ({
          ...prevState,
          variable: parseFloat(p.value) || 0,
        }));
        log(`📝 Variable = ${p.value || 0}`);
        break;
      case "change_var":
        setState((prevState) => ({
          ...prevState,
          variable: prevState.variable + (parseFloat(p.value) || 1),
        }));
        log(
          `➕ Variable + ${p.value || 1} = ${state.variable + (parseFloat(p.value) || 1)}`,
        );
        break;
      case "show_var":
        setState((prevState) => ({ ...prevState, showVar: true }));
        log(`👁️ Mostrando variable: ${state.variable}`);
        break;
    }
  };

  const highlightBlock = (el: HTMLElement | null) => {
    if (el) el.classList.add("executing");
  };

  const unhighlightBlock = (el: HTMLElement | null) => {
    if (el) el.classList.remove("executing");
  };

  const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const stopExecution = () => {
    setState((prevState) => ({ ...prevState, stopRequested: true }));
    log("⏹ Programa detenido", "error");
  };

  const finishExecution = () => {
    setState((prevState) => ({
      ...prevState,
      running: false,
      stopRequested: false,
    }));
    const runBtn = document.getElementById("runBtn");
    if (runBtn) {
      runBtn.classList.remove("running");
      runBtn.innerHTML = "▶ Ejecutar";
    }
    const stageStatus = document.getElementById("stageStatus");
    if (stageStatus) {
      stageStatus.textContent = "Listo";
    }
    if (workspaceRef.current) {
      workspaceRef.current
        .querySelectorAll(".block")
        .forEach((b) => b.classList.remove("executing"));
    }
    log("✅ Programa finalizado", "success");
  };

  const clearWorkspace = () => {
    if (workspaceRef.current) {
      workspaceRef.current
        .querySelectorAll(".block")
        .forEach((b) => b.remove());
    }
    const emptyMsg = document.getElementById("emptyMsg");
    if (emptyMsg) emptyMsg.style.display = "";
    updateBlockCount();
    setState((prevState) => ({
      ...prevState,
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
      showVar: false,
    }));
    setConsoleLogs([]);
    log("🗑️ Área limpiada", "info");
  };

  const cycleSpeed = () => {
    const speeds = [1, 2, 5, 10];
    const idx = speeds.indexOf(state.speed);
    const newSpeed = speeds[(idx + 1) % speeds.length];
    setState((prevState) => ({ ...prevState, speed: newSpeed }));
    const speedBtn = document.getElementById("speedBtn");
    if (speedBtn) {
      speedBtn.textContent = `⚡ ${newSpeed}x`;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid
      ctx.strokeStyle = "#ffffff08";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Trails
      state.trailPoints.forEach((t) => {
        ctx.beginPath();
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.moveTo(t.x1, t.y1);
        ctx.lineTo(t.x2, t.y2);
        ctx.stroke();
      });

      // Stamps
      state.stamps.forEach((s) =>
        drawShape(ctx, s.x, s.y, s.size, s.shape, `${s.color}80`, 0),
      );

      // Particles
      const newParticles = state.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        const alpha = Math.max(0, p.life / 60);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return p.life > 0;
      });
      if (newParticles.length !== state.particles.length) {
        setState((prevState) => ({ ...prevState, particles: newParticles }));
      }

      // Direction arrow
      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.rotate((state.angle * Math.PI) / 180);
      ctx.strokeStyle = "#ffffff40";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(state.size + 12, 0);
      ctx.stroke();
      ctx.fillStyle = "#ffffff40";
      ctx.beginPath();
      ctx.moveTo(state.size + 16, 0);
      ctx.lineTo(state.size + 8, -5);
      ctx.lineTo(state.size + 8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Main sprite
      drawShape(
        ctx,
        state.x,
        state.y,
        state.size,
        state.shape,
        state.color,
        state.angle,
      );

      // Inner highlight
      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.arc(
        -state.size * 0.25,
        -state.size * 0.25,
        state.size * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();

      // Speech bubble
      if (state.speech && state.speechTimer > 0) {
        const newSpeechTimer = state.speechTimer - 1;
        const bx = state.x + state.size + 10;
        const by = state.y - state.size - 30;

        ctx.fillStyle = "#fff";
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 8;
        const metrics = ctx.measureText(state.speech);
        const tw = metrics.width + 16;

        // Bubble
        ctx.beginPath();
        ctx.roundRect(bx - 4, by - 8, tw + 8, 28, 8);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(bx + 4, by + 20);
        ctx.lineTo(bx - 4, by + 30);
        ctx.lineTo(bx + 14, by + 20);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#333";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(state.speech, bx + 4, by + 12);

        if (newSpeechTimer <= 0) {
          setState((prevState) => ({
            ...prevState,
            speech: null,
            speechTimer: 0,
          }));
        } else {
          setState((prevState) => ({
            ...prevState,
            speechTimer: newSpeechTimer,
          }));
        }
      }

      // Show variable
      if (state.showVar) {
        ctx.fillStyle = "rgba(243,156,18,0.9)";
        ctx.beginPath();
        ctx.roundRect(10, 10, 100, 30, 6);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`Var: ${state.variable}`, 22, 30);
      }

      requestAnimationFrame(render);
    };
    render();
  }, [state]);

  const drawShape = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    shape: string,
    color: string,
    angle: number,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    switch (shape) {
      case "circle":
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "square":
        ctx.fillRect(-size, -size, size * 2, size * 2);
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size, size);
        ctx.lineTo(size, size);
        ctx.closePath();
        ctx.fill();
        break;
      case "star":
        drawStar(ctx, 0, 0, 5, size, size / 2);
        ctx.fill();
        break;
      case "diamond":
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.7, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        break;
    }
    ctx.restore();
  };

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerR: number,
    innerR: number,
  ) => {
    ctx.beginPath();
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
  };

  useEffect(() => {
    const toolbox = document.getElementById("toolbox");
    if (!toolbox) return;

    toolbox.addEventListener("dragstart", (e: any) => {
      const block = e.target.closest(".block");
      if (!block) return;
      const type = block.dataset.type;
      const params: Record<string, string> = {};
      block.querySelectorAll("[data-param]").forEach((inp: any) => {
        params[inp.dataset.param] = inp.value;
      });
      const dragData = { type, params, source: "toolbox" };
      e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = "copy";

      // Ghost
      const dragGhost = block.cloneNode(true) as HTMLElement;
      dragGhost.classList.add("drag-ghost");
      document.body.appendChild(dragGhost);
      e.dataTransfer.setDragImage(new Image(), 0, 0);
    });

    document.addEventListener("dragover", (e: any) => {
      e.preventDefault();
      const dragGhost = document.querySelector(".drag-ghost") as HTMLElement;
      if (dragGhost) {
        dragGhost.style.left = e.clientX + 10 + "px";
        dragGhost.style.top = e.clientY - 20 + "px";
      }
    });

    document.addEventListener("dragend", () => {
      const dragGhost = document.querySelector(".drag-ghost") as HTMLElement;
      if (dragGhost) dragGhost.remove();
      if (workspaceRef.current) {
        workspaceRef.current.classList.remove("drag-over");
      }
    });

    if (workspaceRef.current) {
      workspaceRef.current.addEventListener("dragover", (e: any) => {
        e.preventDefault();
        workspaceRef.current?.classList.add("drag-over");
      });

      workspaceRef.current.addEventListener("dragleave", () => {
        workspaceRef.current?.classList.remove("drag-over");
      });

      workspaceRef.current.addEventListener("drop", (e: any) => {
        e.preventDefault();
        workspaceRef.current?.classList.remove("drag-over");
        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;
        const dragData = JSON.parse(data);
        addBlockToWorkspace(dragData.type, dragData.params);
      });
    }
  }, []);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-10 h-20 bg-white/70 backdrop-blur-[20px] shadow-[0_40px_40px_rgba(39,48,52,0.06)] rounded-b-[2.5rem]">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-black text-pink-600 font-headline tracking-tight">
            CodeAtelier
          </h1>
          <nav className="hidden md:flex gap-8 items-center">
            <a
              className="text-slate-500 font-medium hover:text-pink-500 transition-colors"
              href="#"
            >
              Explorar
            </a>
            <a
              className="text-pink-600 font-bold border-b-2 border-pink-500 pb-1"
              href="#"
            >
              Desafíos
            </a>
            <a
              className="text-slate-500 font-medium hover:text-pink-500 transition-colors"
              href="#"
            >
              Tutoriales
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button className="p-2 text-slate-500 hover:text-pink-500 transition-transform scale-95 active:scale-90">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-slate-500 hover:text-pink-500 transition-transform scale-95 active:scale-90">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
          <button
            id="runBtn"
            className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold px-6 py-2 rounded-full transition-transform scale-95 active:scale-90"
            onClick={runProgram}
          >
            ▶ Ejecutar
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
            <img
              alt="Student avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyPEM20O_a39l16FmyGYuYHKj-zUB7CuDidOvgwgN_4loBGUN9l5ySc2JDGjeBL3pKN75El2toe8eOvR18-8wg51KReuL0eeMbYrBqIXSiOCd0JLFhLblA2XJSbc8ttAOs98S9cj-dqvk2ctWXB3gOlXN6LXyOn4WXuMmLxFVcr9thB0ESzSNK15bNxiRzwk_LHY6pSMQfw34AwUQxhL1Fv4ufX4hYC5VffEcsJYsqaTy8p3L2Jptc5u36cHNQ6c35aRmLkmNJjzc"
            />
          </div>
        </div>
      </header>

      <main className="pt-24 h-screen flex">
        <aside className="flex flex-col py-8 gap-4 h-screen w-64 rounded-r-[3rem] sticky left-0 bg-sky-50 shadow-xl">
          <div className="px-8 mb-4">
            <h2 className="font-headline font-bold text-blue-600 text-lg">
              Project Alpha
            </h2>
            <p className="text-xs text-slate-500 opacity-70">V0.1.2</p>
          </div>
          <nav className="flex flex-col gap-1">
            <a
              className="text-pink-600 font-bold flex items-center gap-3 py-3 px-6 bg-white rounded-full mx-2 translate-x-1 transition-transform"
              href="#"
            >
              <span className="material-symbols-outlined">extension</span>
              <span className="text-sm font-['Be_Vietnam_Pro']">Workspace</span>
            </a>
            <a
              className="text-slate-500 flex items-center gap-3 py-3 px-6 hover:bg-white/50 rounded-full mx-2 transition-transform"
              href="#"
            >
              <span className="material-symbols-outlined">auto_stories</span>
              <span className="text-sm font-['Be_Vietnam_Pro']">Library</span>
            </a>
            <a
              className="text-slate-500 flex items-center gap-3 py-3 px-6 hover:bg-white/50 rounded-full mx-2 transition-transform"
              href="#"
            >
              <span className="material-symbols-outlined">group</span>
              <span className="text-sm font-['Be_Vietnam_Pro']">Community</span>
            </a>
            <a
              className="text-slate-500 flex items-center gap-3 py-3 px-6 hover:bg-white/50 rounded-full mx-2 transition-transform"
              href="#"
            >
              <span className="material-symbols-outlined">inventory_2</span>
              <span className="text-sm font-['Be_Vietnam_Pro']">Archive</span>
            </a>
          </nav>
          <div className="mt-auto px-6">
            <button className="w-full bg-secondary text-on-secondary py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">add</span>
              New Block
            </button>
          </div>
        </aside>

        <section className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-secondary p-1 rounded-xl shadow-lg">
            <div className="bg-white/90 backdrop-blur-md rounded-[0.6rem] px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧩</span>
                <h2 className="font-headline font-extrabold text-xl tracking-tight text-on-surface">
                  BlockCode Simulator
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-surface-container rounded-full px-4 py-1.5 gap-4">
                  <span className="text-xs font-bold text-slate-500">
                    SPEED
                  </span>
                  <input
                    id="speedBtn"
                    className="accent-primary w-24 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={state.speed}
                    onChange={cycleSpeed}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-2 bg-tertiary-container text-on-tertiary-container px-5 py-2 rounded-full font-bold hover:scale-105 transition-transform shadow-sm"
                    onClick={runProgram}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      play_arrow
                    </span>
                    Run
                  </button>
                  <button
                    className="flex items-center gap-2 bg-error-container text-on-error-container px-5 py-2 rounded-full font-bold hover:scale-105 transition-transform shadow-sm"
                    onClick={stopExecution}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      stop
                    </span>
                    Stop
                  </button>
                  <button
                    className="flex items-center gap-2 bg-surface-container-high text-on-surface-variant px-5 py-2 rounded-full font-bold hover:scale-105 transition-transform shadow-sm"
                    onClick={clearWorkspace}
                  >
                    <span className="material-symbols-outlined">
                      delete_sweep
                    </span>
                    Clear
                  </button>
                  <button
                    className="flex items-center gap-2 bg-surface-container-high text-on-surface-variant px-5 py-2 rounded-full font-bold hover:scale-105 transition-transform shadow-sm"
                    onClick={cambiarModo}
                  >
                    {modo === "bloques" ? (
                      <>
                        <span className="material-symbols-outlined">code</span>
                        Código
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">toys</span>
                        Bloques
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
            {modo === "bloques" ? (
              <>
                <div className="col-span-3 bg-surface-container-lowest rounded-xl flex flex-col overflow-hidden shadow-sm">
                  <div className="p-4 bg-surface-container-low border-b border-surface-container">
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                      Toolbox
                    </h3>
                  </div>
                  <div
                    id="toolbox"
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                  >
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-blue-600 px-2 uppercase">
                        Movimiento
                      </span>
                      <div
                        className="bg-blue-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="move_forward"
                        onClick={() =>
                          addBlockToWorkspace("move_forward", {
                            distance: "30",
                          })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          arrow_forward
                        </span>
                        Avanzar 30 px
                      </div>
                      <div
                        className="bg-blue-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="move_backward"
                        onClick={() =>
                          addBlockToWorkspace("move_backward", {
                            distance: "30",
                          })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          arrow_back
                        </span>
                        Retroceder 30 px
                      </div>
                      <div
                        className="bg-blue-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="move_up"
                        onClick={() =>
                          addBlockToWorkspace("move_up", { distance: "30" })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          arrow_upward
                        </span>
                        Subir 30 px
                      </div>
                      <div
                        className="bg-blue-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="move_down"
                        onClick={() =>
                          addBlockToWorkspace("move_down", { distance: "30" })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          arrow_downward
                        </span>
                        Bajar 30 px
                      </div>
                      <div
                        className="bg-blue-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="go_to"
                        onClick={() => addBlockToWorkspace("go_to", {})}
                      >
                        <span className="material-symbols-outlined text-sm">
                          my_location
                        </span>
                        Ir a centro
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-purple-600 px-2 uppercase">
                        Giro
                      </span>
                      <div
                        className="bg-purple-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="turn_right"
                        onClick={() =>
                          addBlockToWorkspace("turn_right", { angle: "90" })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          rotate_right
                        </span>
                        Girar ↻ 90°
                      </div>
                      <div
                        className="bg-purple-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="turn_left"
                        onClick={() =>
                          addBlockToWorkspace("turn_left", { angle: "90" })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          rotate_left
                        </span>
                        Girar ↺ 90°
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-pink-600 px-2 uppercase">
                        Apariencia
                      </span>
                      <div
                        className="bg-pink-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="change_color"
                        onClick={() =>
                          addBlockToWorkspace("change_color", { color: "cyan" })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          palette
                        </span>
                        Color
                      </div>
                      <div
                        className="bg-pink-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="change_size"
                        onClick={() =>
                          addBlockToWorkspace("change_size", { size: "20" })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          zoom_in
                        </span>
                        Tamaño 20 px
                      </div>
                      <div
                        className="bg-pink-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="change_shape"
                        onClick={() =>
                          addBlockToWorkspace("change_shape", {
                            shape: "circle",
                          })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          change_history
                        </span>
                        Forma
                      </div>
                      <div
                        className="bg-pink-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="trail_on"
                        onClick={() => addBlockToWorkspace("trail_on", {})}
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>
                        Activar rastro
                      </div>
                      <div
                        className="bg-pink-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="trail_off"
                        onClick={() => addBlockToWorkspace("trail_off", {})}
                      >
                        <span className="material-symbols-outlined text-sm">
                          block
                        </span>
                        Desactivar rastro
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-indigo-600 px-2 uppercase">
                        Sonido
                      </span>
                      <div
                        className="bg-indigo-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="play_beep"
                        onClick={() =>
                          addBlockToWorkspace("play_beep", { note: "C" })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          music_note
                        </span>
                        Tocar sonido "Pop"
                      </div>
                      <div
                        className="bg-indigo-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="play_drum"
                        onClick={() => addBlockToWorkspace("play_drum", {})}
                      >
                        <span className="material-symbols-outlined text-sm">
                          graphic_eq
                        </span>
                        Tocar tambor
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-orange-600 px-2 uppercase">
                        Control
                      </span>
                      <div
                        className="bg-orange-500 text-white p-4 rounded-lg cursor-grab hover:scale-105 transition-transform flex flex-col gap-2 text-sm"
                        draggable="true"
                        data-type="repeat"
                        onClick={() =>
                          addBlockToWorkspace("repeat", { times: "4" })
                        }
                      >
                        <div className="flex items-center gap-2 font-bold">
                          <span className="material-symbols-outlined text-sm">
                            sync
                          </span>
                          Repetir 4 veces
                        </div>
                        <div className="h-8 w-full border-2 border-white/30 rounded border-dashed"></div>
                      </div>
                      <div
                        className="bg-orange-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="forever"
                        onClick={() => addBlockToWorkspace("forever", {})}
                      >
                        <span className="material-symbols-outlined text-sm">
                          sync_alt
                        </span>
                        Por siempre
                      </div>
                      <div
                        className="bg-orange-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="if_edge"
                        onClick={() => addBlockToWorkspace("if_edge", {})}
                      >
                        <span className="material-symbols-outlined text-sm">
                          wall
                        </span>
                        Si toca borde
                      </div>
                      <div
                        className="bg-orange-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="end_block"
                        onClick={() => addBlockToWorkspace("end_block", {})}
                      >
                        <span className="material-symbols-outlined text-sm">
                          stop
                        </span>
                        Fin de bloque
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-emerald-600 px-2 uppercase">
                        Variables
                      </span>
                      <div
                        className="bg-emerald-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="set_var"
                        onClick={() =>
                          addBlockToWorkspace("set_var", { value: "0" })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit_note
                        </span>
                        Set Puntos a 0
                      </div>
                      <div
                        className="bg-emerald-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="change_var"
                        onClick={() =>
                          addBlockToWorkspace("change_var", { value: "1" })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">
                          add
                        </span>
                        Cambiar Puntos por 1
                      </div>
                      <div
                        className="bg-emerald-500 text-white p-3 rounded-lg block-notch cursor-grab hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        draggable="true"
                        data-type="show_var"
                        onClick={() => addBlockToWorkspace("show_var", {})}
                      >
                        <span className="material-symbols-outlined text-sm">
                          visibility
                        </span>
                        Mostrar variable
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-5 bg-surface-container-low rounded-xl relative canvas-grid flex flex-col overflow-hidden shadow-sm">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="bg-white/80 p-2 rounded-full shadow-sm hover:bg-white transition-colors">
                      <span className="material-symbols-outlined text-slate-400">
                        zoom_in
                      </span>
                    </button>
                    <button className="bg-white/80 p-2 rounded-full shadow-sm hover:bg-white transition-colors">
                      <span className="material-symbols-outlined text-slate-400">
                        zoom_out
                      </span>
                    </button>
                  </div>
                  <div className="workspace-header bg-surface-container-high p-3 flex justify-between items-center">
                    <span>📋 Área de Código</span>
                    <span id="blockCount">0 bloques</span>
                  </div>
                  <div
                    ref={workspaceRef}
                    className="workspace flex-1 overflow-y-auto p-10 space-y-0 relative"
                  >
                    <div
                      id="emptyMsg"
                      className="workspace-empty flex flex-col items-center justify-center text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-[3rem] mb-2">
                        toys
                      </span>
                      <p>
                        Arrastra bloques aquí para
                        <br />
                        crear tu programa
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-8 bg-surface-container-low rounded-xl relative canvas-grid flex flex-col overflow-hidden shadow-sm">
                <div className="workspace-header bg-surface-container-high p-3 flex justify-between items-center">
                  <span>📝 Editor de Código</span>
                </div>
                <textarea
                  className="flex-1 p-4 bg-surface-container-lowest rounded-b-xl font-mono resize-none"
                  value={codigoSimple}
                  onChange={(e) => setCodigoSimple(e.target.value)}
                  placeholder="// Escribe tu código aquí..."
                />
              </div>
            )}

            <div className="col-span-4 flex flex-col gap-6">
              <div className="flex-1 bg-slate-950 rounded-xl overflow-hidden relative border-4 border-white shadow-2xl">
                <div className="absolute inset-0 opacity-20">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQcMr4lIOKCRlr6kTUmZTFO7w5pl1m2mOgcwjoas4EpNnARmUZCCButv6Bq-N7lV-5o-u7dwP_s70Ubex0KphoaJlyDgHbhuTVb-0_Ejd8oYG-o-7OseAgVYw49sk_TeWWUAIwJON7rUOd6i5CBSB9LJ7xeIifVGhgDd1bR_gQL5fK2erVkIgqFGgKf1Y1tkQu8KsevYxwN9Oco-jcP2LYxrj1yvjehA2vF0GAp3QzQ1BpYkvXFSady4qfOxHekEVKFwi1f69a-N4"
                    alt="Deep space nebula with vibrant stars and cosmic dust in dark purple and blue tones"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      id="stage"
                      width="356"
                      height="356"
                      className="w-full h-full"
                    ></canvas>
                  </div>
                </div>
                <div
                  id="stageStatus"
                  className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-cyan-400 font-mono"
                >
                  Listo
                </div>
              </div>

              <div className="h-48 bg-slate-900 rounded-xl flex flex-col overflow-hidden shadow-inner font-mono text-xs">
                <div className="p-3 bg-slate-800 flex justify-between items-center">
                  <span className="text-slate-400 font-bold tracking-widest uppercase">
                    Console
                  </span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="console-content flex-1 p-4 space-y-1 overflow-y-auto">
                  {consoleLogs.map((log, index) => (
                    <p key={index} className={`console-line ${log.type}`}>
                      <span className="time text-slate-500">{log.time}</span>
                      <span
                        className={`msg ${log.type === "error" ? "text-red-400" : log.type === "success" ? "text-green-400" : log.type === "warn" ? "text-yellow-400" : "text-slate-300"}`}
                      >
                        {log.msg}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings:
            "FILL" 0,
            "wght" 400,
            "GRAD" 0,
            "opsz" 24;
        }
        .canvas-grid {
          background-image: radial-gradient(
            circle,
            #ffffff08 1px,
            transparent 1px
          );
          background-size: 24px 24px;
        }
        .block-notch {
          clip-path: polygon(
            0% 0%,
            20% 0%,
            25% 10%,
            45% 10%,
            50% 0%,
            100% 0%,
            100% 100%,
            50% 100%,
            45% 90%,
            25% 90%,
            20% 100%,
            0% 100%
          );
        }
        .block {
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 6px;
          cursor: grab;
          font-size: 0.82rem;
          font-weight: 600;
          position: relative;
          transition:
            transform 0.15s,
            box-shadow 0.15s;
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          border: 2px solid transparent;
        }
        .block:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        .block:active {
          cursor: grabbing;
        }
        .block.executing {
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          transform: scale(1.03);
          border-color: #fff !important;
        }
        .block input,
        .block select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8rem;
          text-align: center;
        }
        .block select {
          width: auto;
          cursor: pointer;
        }
        .block-move {
          background: #2980b9;
          border-color: #3498db;
        }
        .block-turn {
          background: #8e44ad;
          border-color: #9b59b6;
        }
        .block-look {
          background: #e74c3c;
          border-color: #c0392b;
        }
        .block-sound {
          background: #1abc9c;
          border-color: #16a085;
        }
        .block-action {
          background: #e67e22;
          border-color: #f39c12;
        }
        .block-control {
          background: #27ae60;
          border-color: #2ecc71;
        }
        .block-variable {
          background: #f39c12;
          border-color: #e67e22;
        }
        .delete-btn {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.4);
          border: none;
          color: #ff6b6b;
          cursor: pointer;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .block:hover .delete-btn {
          opacity: 1;
        }
        .workspace-empty {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: #404060;
          pointer-events: none;
        }
        .workspace-empty .big-icon {
          font-size: 3rem;
          margin-bottom: 10px;
        }
        .workspace-empty p {
          font-size: 0.9rem;
        }
        .drag-ghost {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.85;
          transform: rotate(2deg) scale(1.05);
        }
      `}</style>
    </div>
  );
};
