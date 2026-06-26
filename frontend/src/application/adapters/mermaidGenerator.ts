import type { Block, BlockCategory, BlockDefinition } from "../../shared/types/Simulador";

interface DiagramExit {
  id: string;
  label?: string;
}

interface DiagramState {
  lines: string[];
  defMap: Map<string, BlockDefinition>;
  counter: number;
  nodeByBlockId: Map<string, string>;
}

const buildDefMap = (defs: BlockDefinition[]): Map<string, BlockDefinition> =>
  new Map(defs.map((definition) => [definition.type, definition]));

const escapeLabel = (label: string): string =>
  label.replace(/"/g, "'").replace(/[<>]/g, "").trim();

const humanize = (value: string): string =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function blockLabel(
  type: string,
  params: Record<string, string>,
  defMap: Map<string, BlockDefinition>,
): string {
  const definition = defMap.get(type);
  const baseLabel = definition?.label ?? humanize(type);
  const values = Object.entries(params)
    .filter(([, value]) => value !== "")
    .map(([name, value]) => {
      const option = definition?.paramOptions?.[name]?.find((item) => item.value === value);
      return option?.label ?? value;
    });

  if (values.length === 0 || baseLabel.includes(values[0])) return escapeLabel(baseLabel);
  return escapeLabel(`${baseLabel.replace(/\([^)]*\)/g, "").trim()} (${values.join(", ")})`);
}

function loopLabel(block: Block, defMap: Map<string, BlockDefinition>): string {
  const definition = defMap.get(block.type);
  const loopType = definition?.loopConfig?.type;

  if (loopType === "while") {
    return `¿Continuar mientras ${block.params?.condicion || "se cumpla la condición"}?`;
  }
  if (loopType === "forEach") {
    return `¿Quedan elementos en ${block.params?.coleccion || "la colección"}?`;
  }
  return `¿Quedan iteraciones? (${block.params?.iteraciones || block.params?.repeticiones || "3"})`;
}

function nodeShape(label: string, category: BlockCategory): string {
  if (category === "event") return `(["${label}"])`;
  if (category === "condition" || category === "loop") return `{"${label}"}`;
  return `[["${label}"]]`;
}

function connect(lines: string[], exits: DiagramExit[], target: string, firstLabel?: string): void {
  exits.forEach((exit, index) => {
    const label = exit.label ?? (index === 0 ? firstLabel : undefined);
    lines.push(label ? `  ${exit.id} -->|"${escapeLabel(label)}"| ${target}` : `  ${exit.id} --> ${target}`);
  });
}

function createNode(state: DiagramState, block: Block): string {
  const id = `N${state.counter++}`;
  const label = block.category === "loop"
    ? loopLabel(block, state.defMap)
    : blockLabel(block.type, block.params, state.defMap);

  state.lines.push(`  ${id}${nodeShape(label, block.category)}`);
  state.lines.push(`  class ${id} ${block.category}`);
  state.nodeByBlockId.set(block.id, id);
  return id;
}

function emitSequence(
  blocks: Block[],
  incoming: DiagramExit[],
  state: DiagramState,
  firstEdgeLabel?: string,
): DiagramExit[] {
  let exits = incoming;

  blocks.forEach((block, index) => {
    const nodeId = createNode(state, block);
    connect(state.lines, exits, nodeId, index === 0 ? firstEdgeLabel : undefined);

    if (block.category === "condition") {
      if (block.children?.length) {
        const trueExits = emitSequence(block.children, [{ id: nodeId }], state, "Sí");
        exits = [...trueExits, { id: nodeId, label: "No" }];
      } else {
        exits = [{ id: nodeId, label: "Sí / No" }];
      }
      return;
    }

    if (block.category === "loop") {
      let bodyExits: DiagramExit[];
      if (block.children?.length) {
        bodyExits = emitSequence(block.children, [{ id: nodeId }], state, "Sí, ejecutar");
      } else {
        const bodyId = `N${state.counter++}`;
        state.lines.push(`  ${bodyId}[["Ejecutar cuerpo del bucle"]]`);
        state.lines.push(`  class ${bodyId} action`);
        state.lines.push(`  ${nodeId} -->|"Sí, ejecutar"| ${bodyId}`);
        bodyExits = [{ id: bodyId }];
      }
      connect(state.lines, bodyExits, nodeId, "Siguiente vuelta");
      exits = [{ id: nodeId, label: "No, continuar" }];
      return;
    }

    exits = [{ id: nodeId }];
  });

  return exits;
}

function buildDiagram(
  blocks: Block[],
  blockDefinitions: BlockDefinition[] = [],
): { definition: string; nodeByBlockId: Map<string, string> } {
  const state: DiagramState = {
    lines: [
      "flowchart TD",
      "  classDef terminator fill:#0f766e,stroke:#5eead4,color:#f0fdfa,stroke-width:2px",
      "  classDef event fill:#164e63,stroke:#67e8f9,color:#ecfeff,stroke-width:2px",
      "  classDef action fill:#1e293b,stroke:#94a3b8,color:#f8fafc,stroke-width:1.5px",
      "  classDef condition fill:#4c1d95,stroke:#c4b5fd,color:#faf5ff,stroke-width:2px",
      "  classDef loop fill:#7c2d12,stroke:#fdba74,color:#fff7ed,stroke-width:2px",
      "  classDef empty fill:#172033,stroke:#64748b,color:#cbd5e1,stroke-dasharray:5 4",
      "  classDef active fill:#0f766e,stroke:#99f6e4,color:#f0fdfa,stroke-width:4px",
      "  classDef done fill:#166534,stroke:#86efac,color:#f0fdf4,stroke-width:2px",
      "  START([Inicio])",
      "  class START terminator",
    ],
    defMap: buildDefMap(blockDefinitions),
    counter: 0,
    nodeByBlockId: new Map(),
  };

  let exits: DiagramExit[];
  if (blocks.length === 0) {
    state.lines.push('  EMPTY["Agrega bloques al workspace"]');
    state.lines.push("  class EMPTY empty");
    state.lines.push("  START --> EMPTY");
    exits = [{ id: "EMPTY" }];
  } else {
    exits = emitSequence(blocks, [{ id: "START" }], state);
  }

  state.lines.push("  END([Fin])");
  state.lines.push("  class END terminator");
  connect(state.lines, exits, "END");
  state.lines.push("  linkStyle default stroke:#718096,stroke-width:1.7px");

  return { definition: state.lines.join("\n"), nodeByBlockId: state.nodeByBlockId };
}

export function generateMermaid(blocks: Block[], blockDefinitions?: BlockDefinition[]): string {
  return buildDiagram(blocks, blockDefinitions).definition;
}

export function generateExecutionTrace(
  blocks: Block[],
  currentBlockId: string | null,
  iterationContext: { blockId: string; iteration: number; total: number }[],
): string {
  const diagram = buildDiagram(blocks);
  const lines = diagram.definition.split("\n");
  const activeNode = currentBlockId ? diagram.nodeByBlockId.get(currentBlockId) : undefined;

  if (activeNode) {
    lines.push(`  class ${activeNode} active`);
    const iteration = iterationContext.find((context) => context.blockId === currentBlockId);
    if (iteration) {
      lines.push(`  TRACE_NOTE["Iteración ${iteration.iteration} de ${iteration.total}"]`);
      lines.push("  class TRACE_NOTE event");
      lines.push(`  ${activeNode} -.-> TRACE_NOTE`);
    }
  }

  const activeTopLevelIndex = blocks.findIndex((block) => block.id === currentBlockId);
  blocks.slice(0, Math.max(0, activeTopLevelIndex)).forEach((block) => {
    const node = diagram.nodeByBlockId.get(block.id);
    if (node) lines.push(`  class ${node} done`);
  });

  return lines.join("\n");
}
