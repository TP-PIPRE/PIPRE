import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { DailyProgress } from "../../src/ui/components/common/DailyProgress";
import { DailyChallengeStage } from "../../src/ui/components/common/DailyChallengeStage";
import { DailyChallengeCard } from "../../src/ui/components/common/DailyChallengeCard";
import { gameProgressService } from "../../src/infrastructure/api/gameProgressService";
import { getAuthState } from "../../src/infrastructure/store/authStore";
import { useAchievementStore } from "../../src/infrastructure/store/achievementStore";
import { NEONFLOW_LEVELS } from "../../src/shared/constants/levelConfigs";
import type { DailySetDTO, GameVictoryDTO } from "../../src/infrastructure/api/models/gameProgressModels";

vi.mock("../../src/infrastructure/api/gameProgressService",()=>({gameProgressService:{dailySet:vi.fn(),daily:vi.fn()}}));
vi.mock("../../src/infrastructure/store/authStore",()=>({getAuthState:vi.fn()}));
vi.mock("../../src/ui/components/NeonFlow/NeonFlowStage",()=>({NeonFlowStage:()=> <p>Tablero actual</p>}));
vi.mock("../../src/ui/components/TetriLogic/TetriLogicStage",()=>({TetriLogicStage:()=> <p>Tablero actual</p>}));
const set=(count=0):DailySetDTO=>({date:"2030-01-01",timeZone:"America/Lima",expiresAt:"2099-01-01T05:00:00Z",challenges:Array.from({length:5},(_,i)=>({id:`exercise-${i}`,date:"2030-01-01",slot:i+1,game:"neonflow",levelNumber:1,levelTemplate:"neonflow-v2-1",difficulty:"easy",config:NEONFLOW_LEVELS[0],completedAt:i<count?"2030-01-01T12:00:00Z":null,bestStars:i<count?3:0}))});
beforeEach(()=>{
  vi.clearAllMocks();useAchievementStore.setState({revisions:{},notifications:[]});
  vi.mocked(getAuthState).mockReturnValue({user:{id:"student",role:"student",name:"Alumno",email:"qa@test.invalid"},isAuthenticated:true});
  vi.mocked(gameProgressService.dailySet).mockResolvedValue(set());
  vi.mocked(gameProgressService.daily).mockResolvedValue({id:"2030-01-01",date:"2030-01-01",timeZone:"America/Lima",game:"neonflow",levelNumber:1,levelTemplate:"neonflow-v2-1",completed:false,currentStreak:0,bestStreak:0});
});
afterEach(cleanup);
it.each([0,1,2,3,4,5])("shows exact daily percentage for %i completed exercises",count=>{
  render(<DailyProgress daily={set(count)}/>);
  expect(screen.getByRole("progressbar")).toHaveAttribute("value",String(count));
  expect(screen.getByText(`${count}/5 ejercicios completados · ${count*20} % · ${count===5?"Completado":count>0?"En progreso":"Pendiente"}`)).toBeInTheDocument();
});
it("hides the lower exercise list and never trusts a legacy single-board completed flag",async()=>{
  const legacy=await gameProgressService.daily("student");vi.mocked(gameProgressService.daily).mockResolvedValue({...legacy,completed:true});
  vi.mocked(gameProgressService.dailySet).mockResolvedValue(set(2));
  render(<MemoryRouter><DailyChallengeCard/></MemoryRouter>);
  await screen.findByText("2/5 ejercicios completados · 40 % · En progreso");
  expect(screen.queryByText("Completado hoy")).not.toBeInTheDocument();
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.getByRole("link",{name:"Continuar reto diario"})).toBeInTheDocument();
});
it("keeps progress on reload, blocks future previews and advances only after server confirmation",async()=>{
  vi.mocked(gameProgressService.dailySet).mockResolvedValue(set(2));
  const view=render(<MemoryRouter initialEntries={["/simulador?daily=true&challenge=exercise-4"]}><DailyChallengeStage/></MemoryRouter>);
  await screen.findByText("Ejercicio 3 de 5 · Neon Flow");
  expect(screen.queryByText(/Ejercicio 5 de 5/)).not.toBeInTheDocument();
  vi.mocked(gameProgressService.dailySet).mockResolvedValue(set(3));
  act(()=>useAchievementStore.getState().confirmed("student",{sessionId:"qa",newAchievements:[]} as unknown as GameVictoryDTO));
  await screen.findByRole("button",{name:"Continuar con el siguiente ejercicio"});
  fireEvent.click(screen.getByRole("button",{name:"Continuar con el siguiente ejercicio"}));
  expect(screen.getByText("Ejercicio 4 de 5 · Neon Flow")).toBeInTheDocument();
  view.unmount();
  vi.mocked(gameProgressService.dailySet).mockResolvedValue(set(5));
  render(<MemoryRouter><DailyChallengeStage/></MemoryRouter>);
  await screen.findByText("Reto diario completado: los cinco ejercicios fueron validados.");
  expect(screen.queryByText("Tablero actual")).not.toBeInTheDocument();
});
