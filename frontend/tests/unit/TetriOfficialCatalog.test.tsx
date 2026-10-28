import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TETRILOGIC_LEVELS } from "../../src/shared/constants/levelConfigs";
import { LEVEL_TEMPLATES, resolveActivityLevel } from "../../src/application/usecases/activityLevels";
import { createInventory, placementError, shapeAt, solutionError } from "../../src/application/usecases/tetrilogic/rules";
import { HistoricalTetriLogicStage as TetriLogicStage } from "../../src/ui/components/TetriLogic/HistoricalTetriLogicStage";
import { useGameStore } from "../../src/infrastructure/store/gameStore";
import type { Piece, RotationAngle } from "../../src/shared/types/TetriLogic";
import witnesses from "../fixtures/tetrilogicSolutions.json";
vi.mock("../../src/infrastructure/api/axiosInstance",()=>({default:{post:vi.fn().mockResolvedValue({status:201})}}));
afterEach(()=>{cleanup();useGameStore.getState().stopGame();});

describe("30 official TetriLogic boards",()=>{
  it("has exactly 30 unique versioned templates and retains both legacy boards",()=>{
    expect(TETRILOGIC_LEVELS).toHaveLength(30);
    expect(new Set(TETRILOGIC_LEVELS.map(l=>l.templateId)).size).toBe(30);
    expect(new Set(TETRILOGIC_LEVELS.map(l=>JSON.stringify([l.inventory,l.constraints,l.blockedCells]))).size).toBe(30);
    expect(LEVEL_TEMPLATES.filter(t=>t.game==="tetrilogic")).toHaveLength(32);
  });
  it.each(TETRILOGIC_LEVELS)("validates inventory, geometry, all constraints and a legal solution for level $level",level=>{
    const size=level.level<=5?4:level.level<=20?5:6;
    expect(level.boardSize).toEqual({rows:size,cols:size});
    const inventory=createInventory(level);
    expect([3,4]).toContain(inventory.length);
    const freq=inventory.reduce<Record<string,number>>((a,p)=>({...a,[p.type]:(a[p.type]??0)+1}),{});
    expect(Object.values(freq).filter(n=>n===2).length).toBeLessThanOrEqual(1);
    expect(Math.max(...Object.values(freq))).toBeLessThanOrEqual(2);
    expect(level.constraints).toHaveLength(size*2);
    for(const orientation of ["row","column"]) expect(level.constraints.filter(c=>c.orientation===orientation).reduce((s,c)=>s+c.targetCount,0)).toBe(inventory.length*4);
    const witness=witnesses.find(w=>w.templateId===level.templateId)!;
    const placed:Piece[]=[];
    for (const w of witness.placements) {
      const p=inventory.find(p=>p.id===w.id)!;
      const next={...p,position:w.position,rotation:w.rotation as RotationAngle,shape:shapeAt(p.type,w.rotation)};
      expect(placementError(level,placed,next)).toBeNull();placed.push(next);
    }
    expect(solutionError(level,placed)).toBeNull();
    expect(solutionError(level,placed.slice(0,-1))).toMatch(/todas las piezas/);
    expect(resolveActivityLevel({idActivity:`act-c002-${level.level}`,name:"Reto",environment:"tetrilogic",levelTemplate:level.templateId})?.config).toBe(level);
  });
  it.each(TETRILOGIC_LEVELS)("completes level $level through the actual touch/keyboard UI",level=>{
    render(<MemoryRouter><TetriLogicStage levels={[level]}/></MemoryRouter>);
    const witness=witnesses.find(w=>w.templateId===level.templateId)!;
    for(const w of witness.placements) {
      const p=level.inventory!.find(p=>p.id===w.id)!;
      fireEvent.click(screen.getByRole("button",{name:`Seleccionar pieza ${p.type} (${p.id})`}));
      if(p.type!=="O") for(let r=0;r<w.rotation;r+=90) fireEvent.click(screen.getByRole("button",{name:"Rotar pieza"}));
      const anchor=screen.getByRole("button",{name:new RegExp(`^(Celda vacía|Celda bloqueada|Pieza [A-Z]), fila ${w.position.y+1}, columna ${w.position.x+1}(, debe ocuparse)?$`)});
      fireEvent.click(anchor);
    }
    fireEvent.click(screen.getByRole("button",{name:"Comprobar"}));
    expect(useGameStore.getState().status).toBe("SUCCESS");
    expect(screen.getByRole("heading",{name:"¡Reto completado!"})).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Comprobar"})).toBeDisabled();
  });
  it("enforces precedence and keeps help/checks/metrics after a confirmed reset",()=>{
    const level=TETRILOGIC_LEVELS[0];
    render(<MemoryRouter><TetriLogicStage levels={[level]}/></MemoryRouter>);
    const after=level.inventory!.find(p=>p.id===level.precedences![0].after)!;
    const w=witnesses[0].placements.find(p=>p.id===after.id)!;
    fireEvent.click(screen.getByRole("button",{name:`Seleccionar pieza ${after.type} (${after.id})`}));
    for(let r=0;r<w.rotation && after.type!=="O";r+=90)fireEvent.click(screen.getByRole("button",{name:"Rotar pieza"}));
    fireEvent.click(screen.getByRole("button",{name:new RegExp(`^Celda.*fila ${w.position.y+1}, columna ${w.position.x+1}`)}));
    expect(screen.getByRole("status")).toHaveTextContent(/antes de/);
    fireEvent.click(screen.getByRole("button",{name:"Pista general"}));
    for(let n=0;n<3;n++)fireEvent.click(screen.getByRole("button",{name:"Comprobar"}));
    expect(screen.getByRole("button",{name:"Pista específica"})).toBeEnabled();
    const metrics=useGameStore.getState().movimientos;
    fireEvent.click(screen.getByRole("button",{name:"Reiniciar"}));
    expect(screen.getByRole("dialog",{name:"Reiniciar el tablero"})).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"Reiniciar tablero"}));
    expect(useGameStore.getState().movimientos).toBe(metrics);
    expect(useGameStore.getState().reinicios).toBe(1);
    expect(useGameStore.getState().pistasIa).toBe(0);
    expect(screen.getByRole("complementary",{name:"Pista estática"})).toBeInTheDocument();
    expect(screen.getByRole("button",{name:"Pista específica"})).toBeEnabled();
  });
});
