import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {DocenteDashboard} from "../../src/ui/pages/DocenteDashboard";
const api=vi.hoisted(()=>({groups:vi.fn(),courses:vi.fn(),ranking:vi.fn(),modules:vi.fn(),lessons:vi.fn(),activities:vi.fn(),remove:vi.fn()}));
vi.mock("../../src/infrastructure/api/apiService",()=>({apiService:{groups:{getAll:api.groups},courses:{getAll:api.courses},ranking:{getGroupRanking:api.ranking},modules:{getByCourse:api.modules},lessons:{getByModule:api.lessons},activities:{getByLesson:api.activities,delete:api.remove}}}));
vi.mock("../../src/infrastructure/store/authStore",()=>({getAuthState:()=>({user:{role:"docente"}})}));
beforeEach(()=>{
  vi.resetAllMocks();api.groups.mockResolvedValue([{idGroup:"g1"},{idGroup:"g2"}]);api.courses.mockResolvedValue([{idCourse:"c",name:"Curso"}]);api.ranking.mockImplementation((id:string)=>Promise.resolve(id==="g1"?[{idStudent:"s1",studentName:"Uno",position:1,totalPoints:90}]:[{idStudent:"s1",studentName:"Uno",position:1,totalPoints:90},{idStudent:"s2",studentName:"Dos",position:2,totalPoints:75}]));api.modules.mockResolvedValue([{idModule:"m"}]);api.lessons.mockResolvedValue([{idLesson:"l"}]);api.activities.mockResolvedValue([{idActivity:"a",name:"Reto QA",idLesson:"l",displayOrder:1,difficulty:"EASY"}]);
});
afterEach(cleanup);
const open=()=>render(<MemoryRouter><DocenteDashboard/></MemoryRouter>);
describe("Dashboard persisted data",()=>{
  it("does not replace a failed curriculum API with empty or simulated challenges",async()=>{
    api.courses.mockRejectedValue(new Error("offline"));open();expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar");expect(screen.queryByText("Reto QA")).not.toBeInTheDocument();
  });
  it("counts students across all visible classrooms without duplicate memberships or invented model features",async()=>{
    open();await screen.findByText("Reto QA");expect(screen.getByText("Estudiantes",{selector:"p"}).parentElement).toHaveTextContent("2");expect(api.ranking).toHaveBeenCalledTimes(2);expect(screen.getByRole("link",{name:"Ver métricas educativas"})).toHaveAttribute("href","/docente/metricas");expect(screen.queryByText(/Dashboard de Resultados IA/i)).not.toBeInTheDocument();
  });
  it("keeps an activity visible if its server deletion fails",async()=>{
    api.remove.mockRejectedValue(new Error("No se puede eliminar"));open();await screen.findByText("Reto QA");fireEvent.click(screen.getByRole("button",{name:"Eliminar Reto QA"}));fireEvent.click(screen.getByRole("button",{name:"Eliminar",exact:true}));expect(await screen.findByRole("alert")).toHaveTextContent("No se puede eliminar");expect(api.remove).toHaveBeenCalledWith("a");
  });
});
