import type { Block, BlockCategory, BlockDefinition } from "../../shared/types/Simulador";

function buildDefMap(defs: BlockDefinition[]): Map<string, BlockDefinition> {
  const map = new Map<string, BlockDefinition>();
  for (const d of defs) map.set(d.type, d);
  return map;
}

function blockLabel(type: string, params: Record<string, string>, defMap: Map<string, BlockDefinition>): string {
  const def = defMap.get(type);
  if (!def) return type.replace(/_/g, " ");
  let label = def.label;
  if (def.paramOptions) {
    for (const [pName, opts] of Object.entries(def.paramOptions)) {
      const val = params[pName];
      if (val) {
        const opt = opts.find((o) => o.value === val);
        if (opt) label += ` (${opt.label})`;
      }
    }
  }
  return label;
}

function loopLabel(block: Block): string {
  const param = block.params?.iteraciones || block.params?.repeticiones || "3";
  return `Repetir ×${param}`;
}

function nodeShape(label: string, category: BlockCategory): string {
  const q = label.replace(/"/g, "&quot;");
  if (category === "event") return `(("${q}"))`;
  if (category === "condition") return `{"${q}"}`;
  if (category === "loop") return `{{"${q}"}}`;
  return `["${q}"]`;
}

export function generateMermaid(blocks: Block[], blockDefinitions?: BlockDefinition[]): string {
  const defMap = blockDefinitions ? buildDefMap(blockDefinitions) : new Map();

  if (blocks.length === 0) return "flowchart TD\n  empty[\"Sin bloques en el workspace\"]";

  const lines: string[] = ["flowchart TD"];
  let childCounter = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const id = `B${i}`;
    const label = block.category === "loop"
      ? loopLabel(block)
      : blockLabel(block.type, block.params, defMap);
    const shape = nodeShape(label, block.category);
    lines.push(`  ${id}${shape}`);

    if (i > 0) {
      lines.push(`  B${i - 1} --> ${id}`);
    }

    if (block.category === "loop" && block.children && block.children.length > 0) {
      const subId = `${id}_sub`;
      lines.push(`  subgraph ${subId}["${label}"]`);
      lines.push(`    direction TB`);
      const childIds: string[] = [];
      for (const child of block.children) {
        const cid = `C${childCounter}`;
        childIds.push(cid);
        const clabel = blockLabel(child.type, child.params, defMap);
        const cshape = nodeShape(clabel, child.category);
        lines.push(`    ${cid}${cshape}`);
        childCounter++;
      }
      for (let j = 1; j < childIds.length; j++) {
        lines.push(`    ${childIds[j - 1]} --> ${childIds[j]}`);
      }
      lines.push(`  end`);
      lines.push(`  ${id} --> ${subId}`);
    }
  }

  return lines.join("\n");
}
