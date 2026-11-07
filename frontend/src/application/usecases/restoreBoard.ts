import type {GamePieceState} from "../../infrastructure/api/models/gameProgressModels";
import type {LevelConfig,RotationAngle as TetriRotation} from "../../shared/types/TetriLogic";
import type {Cell,NeonFlowLevelConfig} from "../../shared/types/NeonFlow";
import {createFreePlay,canPlaceFreely} from "./tetrilogic/freePlay";
import {shapeAt} from "./tetrilogic/rules";
import {createNeonGrid} from "./neonflow/board";

// Restore only acknowledged server state. Never replay it as new actions or telemetry.
export function restoreTetriBoard(level:LevelConfig,saved:GamePieceState[]=[]) {
  const state=createFreePlay(level),ids=new Set<string>();
  for(const placed of saved) {
    const piece=state.pieces.find(p=>p.id===placed.id);
    if(!piece||piece.type!==placed.type||ids.has(piece.id)||![0,90,180,270].includes(placed.rotation??0))throw new Error("La partida guardada no corresponde al inventario.");
    const rotation=(placed.rotation??0) as TetriRotation;
    const candidate={...piece,rotation,shape:shapeAt(piece.type,rotation),position:{x:placed.x,y:placed.y}};
    if(!canPlaceFreely(state.size,state.pieces,candidate))throw new Error("La partida guardada contiene una posición no válida.");
    state.pieces=state.pieces.map(p=>p.id===piece.id?candidate:p);ids.add(piece.id);
  }
  return state;
}
export function restoreNeonBoard(level:NeonFlowLevelConfig,saved:GamePieceState[]=[]) {
  const grid=createNeonGrid(level);
  for(const piece of saved) {
    if(!Number.isInteger(piece.x)||!Number.isInteger(piece.y)||piece.x<0||piece.y<0||piece.x>=level.width||piece.y>=level.height)throw new Error("La partida guardada está fuera del tablero.");
    const index=piece.y*level.width+piece.x;
    if(grid.cells[index].type!=="EMPTY"||(piece.x===level.emitter.position.x&&piece.y===level.emitter.position.y))throw new Error("La partida guardada ocupa una celda reservada.");
    if(piece.type==="MIRROR_90"&&[0,90,180,270].includes(piece.rotation??0))grid.cells[index]={x:piece.x,y:piece.y,type:"MIRROR_90",rotation:(piece.rotation??0) as Cell["rotation"]};
    else if(piece.type==="FILTER"&&["red","green","blue"].includes(piece.color??""))grid.cells[index]={x:piece.x,y:piece.y,type:"FILTER",color:piece.color as Cell["color"]};
    else throw new Error("La partida guardada contiene un componente no válido.");
  }
  return grid;
}
