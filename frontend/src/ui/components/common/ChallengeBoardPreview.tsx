import { createNeonGrid } from "../../../application/usecases/neonflow/board";
import { createBoard, createInventory } from "../../../application/usecases/tetrilogic/rules";
import type { NeonFlowLevelConfig } from "../../../shared/types/NeonFlow";
import type { LevelConfig } from "../../../shared/types/TetriLogic";
import { ComponentTray } from "../NeonFlow/ComponentTray";
import { NeonBoard } from "../NeonFlow/NeonBoard";
import { Board } from "../TetriLogic/Board";
import { PieceTray } from "../TetriLogic/PieceTray";
import "../TetriLogic/freePlay.css";

export function NeonFlowPreview({ config }: { config: NeonFlowLevelConfig }) {
  return <section className="neon-flow-stage" aria-label="Vista previa de Neon Flow">
    <div className="lab-stage">
      <NeonBoard grid={createNeonGrid(config)} emitter={config.emitter.position}
        laserColor={config.emitter.color ?? "white"} laserPath={[]} disabled />
      <ComponentTray disabled />
    </div>
  </section>;
}

export function TetriLogicPreview({ config }: { config: LevelConfig }) {
  const inventory = createInventory(config);
  const pieceNumbers = Object.fromEntries(inventory.map((piece, index) => [piece.id, index + 1]));
  const board = createBoard({ ...config, blockedCells: [] });
  return <section className="tetri-free" aria-label="Vista previa de TetriLogic">
    <div className="tetri-free-workspace">
      <div className="tetri-free-canvas">
        <Board board={board} pieces={[]} lineGoals={config.constraints} freePlay disabled />
      </div>
      <aside className="tetri-free-tray" aria-label="Bandeja de piezas">
        <h2>Piezas</h2>
        <PieceTray pieces={inventory} pieceNumbers={pieceNumbers} disabled />
      </aside>
    </div>
  </section>;
}
