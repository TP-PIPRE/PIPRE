import type { Block, EnvironmentConfig, BlockDefinition } from "../../shared/types/Simulador";
import { COMPONENT_WIKI } from "../../shared/constants/componentWiki";
import type { ComponentWikiEntry } from "../../shared/constants/componentWiki";
import { ENERGY_COST } from "../../shared/constants/energyCosts";

export interface FeedbackItem {
  id: string;
  type: "tip" | "warning" | "error" | "info";
  category: "hardware" | "energy" | "structure" | "blocks" | "wiki";
  message: string;
  detail?: string;
  wikiEntries?: ComponentWikiEntry[];
  relatedBlockTypes?: string[];
}

let feedbackCounter = 0;

const parseBlockList = (s: string): string[] =>
  s.split(",").map((x) => x.trim().replace(/^\[|\]$/g, ""));

export function analyzeBlocks(
  blocks: Block[],
  envConfig: EnvironmentConfig,
  installedHardware: string[],
): FeedbackItem[] {
  feedbackCounter = 0;
  const items: FeedbackItem[] = [];
  const blockTypes = new Set(blocks.map((b) => b.type));
  const blockCategories = new Set(blocks.map((b) => b.category));

  const allBlockDefs = envConfig.blocks;
  const defMap = new Map<string, BlockDefinition>();
  for (const d of allBlockDefs) defMap.set(d.type, d);

  const usedDefs = blocks.map((b) => defMap.get(b.type)).filter(Boolean) as BlockDefinition[];

  const add = (type: FeedbackItem["type"], category: FeedbackItem["category"], message: string, detail?: string, relatedBlockTypes?: string[]) => {
    const wikiEntries = relatedBlockTypes
      ? COMPONENT_WIKI.filter((w) => w.relatedBlockTypes.some((t) => relatedBlockTypes.includes(t)))
      : [];
    items.push({
      id: `fb_${feedbackCounter++}`,
      type, category, message, detail, wikiEntries, relatedBlockTypes,
    });
  };

  if (blocks.length === 0) {
    add("info", "blocks", "Arrastra bloques desde la caja de herramientas para comenzar.",
      "Empieza con un bloque de evento (AL_INICIAR_SISTEMA) y agrega acciones debajo.");
    return items;
  }

  // ── 1. Structure checks ──────────────────────────────
  const hasEvent = blockCategories.has("event");
  if (!hasEvent) {
    add("warning", "structure", "No hay bloque de inicio.",
      "Agrega AL_INICIAR_SISTEMA como primer bloque para que el robot ejecute el programa.");
  }

  const eventBlocks = blocks.filter((b) => b.category === "event");
  if (eventBlocks.length > 1) {
    add("tip", "structure", `Tienes ${eventBlocks.length} bloques de evento. Solo el primero se ejecutar\u00e1 autom\u00e1ticamente.`,
      "Usa un solo evento de inicio y coloca toda la l\u00f3gica debajo.");
  }

  const loopCount = blocks.filter((b) => b.category === "loop").length;
  if (blocks.length >= 5 && loopCount === 0) {
    add("tip", "structure", "Varios bloques repetitivos podr\u00edan agruparse en un bucle.",
      "Usa REPETIR o MIENTRAS para ejecutar acciones varias veces sin duplicar bloques.");
  }

  const actionCount = blocks.filter((b) => b.category === "action").length;
  if (actionCount === 0 && hasEvent) {
    add("warning", "blocks", "El evento de inicio no tiene acciones.",
      "Agrega bloques de acci\u00f3n como AVANZAR o ROTAR para que el robot se mueva.");
  }

  // ── 2. Energy checks ─────────────────────────────────
  let totalEnergy = 0;
  const highCostBlocks: string[] = [];
  for (const b of blocks) {
    const cost = ENERGY_COST[b.type] ?? 0;
    totalEnergy += cost;
    if (cost >= 6) highCostBlocks.push(b.type);
  }

  if (totalEnergy > 80) {
    add("warning", "energy", `El programa consume ${totalEnergy} de energ\u00eda. Podr\u00eda agotar la bater\u00eda antes de completar la misi\u00f3n.`,
      "Reduce el n\u00famero de movimientos costosos o usa bucles para optimizar.");
  } else if (totalEnergy > 50) {
    add("tip", "energy", `Consumo energ\u00e9tico estimado: ${totalEnergy}.`,
      highCostBlocks.length > 0
        ? `Los bloques de alto costo son: ${highCostBlocks.map((t) => defMap.get(t)?.label ?? t).join(", ")}.`
        : undefined);
  }

  // ── 3. Hardware checks ────────────────────────────────
  const missingHardware: BlockDefinition[] = [];
  for (const bd of usedDefs) {
    if (bd.hardwareRequired && !installedHardware.includes(bd.hardwareRequired)) {
      missingHardware.push(bd);
    }
  }
  if (missingHardware.length > 0) {
    for (const bd of missingHardware) {
      add("error", "hardware", `${bd.label} requiere ${bd.hardwareRequired} pero no est\u00e1 instalado.`,
        `Instala ${bd.hardwareRequired} en un puerto disponible desde el panel de Hardware.`);
    }
  }

  const emptySlots = envConfig.portSlots.filter((s) => !installedHardware.includes(s.id)).length;
  if (emptySlots > 0 && blocks.length > 0) {
    const suggested = envConfig.hardware.filter((h) => {
      const hwBlocks = h.blocks ? parseBlockList(h.blocks) : [];
      return hwBlocks.some((bt) => blockTypes.has(bt)) && !installedHardware.includes(h.id);
    });
    if (suggested.length > 0) {
      for (const hw of suggested) {
        add("tip", "hardware", `${hw.name} potenciar\u00eda tu programa actual.`,
          hw.desc ? `Instala ${hw.name}: ${hw.desc}` : undefined,
          hw.blocks ? parseBlockList(hw.blocks) : undefined);
      }
    }
  }

  // ── 4. Block pattern checks ──────────────────────────
  const rotateTypes = ["rotar_nucleo", "girar"];
  const sensorTypes = ["al_detectar_obstaculo", "si_distancia", "escanear_enemigo"];

  const hasMove = blockTypes.has("mover_ruedas") || blockTypes.has("avanzar");
  const hasRotate = rotateTypes.some((t) => blockTypes.has(t));
  const hasSensor = sensorTypes.some((t) => blockTypes.has(t));

  if (hasMove && !hasRotate) {
    add("tip", "blocks", "Tu robot solo avanza. Agrega un bloque ROTAR para cambiar de direcci\u00f3n.",
      "Combinar avance y rotaci\u00f3n permite navegar obst\u00e1culos y seguir rutas.");
  }

  if (hasMove && !hasSensor) {
    add("tip", "blocks", "Sin sensores, el robot no detecta obst\u00e1culos.",
      "Agrega un sensor (ultras\u00f3nico o infrarrojo) y un condicional SI_DISTANCIA para evitar colisiones.");
  }

  if (hasSensor && !blockCategories.has("condition")) {
    add("tip", "blocks", "Usas bloques de sensor pero no tienes condicionales.",
      "Combina SI_DISTANCIA con un sensor para que el robot reaccione al entorno.");
  }

  // ── 5. Wiki cross-reference ──────────────────────────
  if (blocks.length > 0) {
    const blockTypesArr = Array.from(blockTypes);
    const wikiMatches = COMPONENT_WIKI.filter((w) =>
      w.relatedBlockTypes.some((t) => blockTypesArr.includes(t)),
    );
    if (wikiMatches.length > 0) {
      const names = wikiMatches.map((w) => w.name).slice(0, 3);
      add("info", "wiki", `Componentes relacionados: ${names.join(", ")}${wikiMatches.length > 3 ? " y m\u00e1s." : "."}`,
        "Estos componentes industriales reales se corresponden con los bloques que est\u00e1s usando. Consulta la Biblioteca para m\u00e1s detalles.",
        wikiMatches.flatMap((w) => w.relatedBlockTypes));
    }
  }

  // ── 6. Mission-specific checks ───────────────────────
  const missionBlockLimit = envConfig.missions[0]?.maxBlocks;
  if (missionBlockLimit && missionBlockLimit > 0 && blocks.length > missionBlockLimit) {
    add("warning", "blocks", `Superaste el l\u00edmite de ${missionBlockLimit} bloques para esta misi\u00f3n.`,
      "Reduce el n\u00famero de bloques o usa bucles para compactar la l\u00f3gica.");
  }

  return items;
}
