import {describe,it,expect} from "vitest";
import {restoreNeonBoard,restoreTetriBoard} from "../../src/application/usecases/restoreBoard";
import {NEONFLOW_LEVELS,TETRILOGIC_LEVELS} from "../../src/shared/constants/levelConfigs";
import {lineGoalsMet} from "../../src/application/usecases/tetrilogic/lineGoals";
import {freePlayReducer} from "../../src/application/usecases/tetrilogic/freePlay";
import {raycast} from "../../src/application/usecases/neonflow/raycast";
import {neonSolved} from "../../src/application/usecases/neonflow/board";
import tetri from "../fixtures/tetrilogicSolutions.json";
import neon from "../fixtures/neonFlowSolutions.json";

describe("Restore acknowledged server boards",()=>{
  it.each(TETRILOGIC_LEVELS.map((level,index)=>[index+1,level] as const))("restores TetriLogic %i and resets to its original inventory",(_,level)=>{
    const placements=tetri.find(row=>row.templateId===level.templateId)!.placements;
    const restored=restoreTetriBoard(level,placements.map(piece=>({id:piece.id,type:level.inventory!.find(item=>item.id===piece.id)!.type,x:piece.position.x,y:piece.position.y,rotation:piece.rotation})));
    expect(lineGoalsMet(level,restored.pieces)).toBe(true);
    const reset=freePlayReducer(restored,{type:"reset"});expect(reset.pieces.every(piece=>piece.position.x<0)).toBe(true);
  });
  it.each(NEONFLOW_LEVELS.map(level=>[level.level,level] as const))("restores Neon Flow %i with its original emitter, blocks and receptors",(_,level)=>{
    const pieces=neon.find(row=>row.templateId===level.templateId)!.placements.map(piece=>({type:piece.type,x:piece.position.x,y:piece.position.y,rotation:piece.rotation,color:piece.color}));
    const restored=restoreNeonBoard(level,pieces);
    expect(neonSolved(restored,raycast(restored,level.emitter.position,level.emitter.direction,level.emitter.color),level.emitter.color)).toBe(true);
  });
  it("rejects duplicated, unknown or overlapping TetriLogic pieces",()=>{
    const level=TETRILOGIC_LEVELS[0],first=level.inventory![0];
    const piece={id:first.id,type:first.type,x:0,y:0,rotation:0};
    expect(()=>restoreTetriBoard(level,[{...piece,id:"foreign"}])).toThrow();expect(()=>restoreTetriBoard(level,[piece,piece])).toThrow();
  });
  it("rejects occupied and reserved optical cells",()=>{
    const level=NEONFLOW_LEVELS[0],piece={type:"MIRROR_90",x:level.emitter.position.x,y:level.emitter.position.y,rotation:0};
    expect(()=>restoreNeonBoard(level,[piece])).toThrow();expect(()=>restoreNeonBoard(level,[{...piece,x:-1}])).toThrow();
  });
});
