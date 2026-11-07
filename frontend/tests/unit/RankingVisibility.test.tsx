import {cleanup,render,screen} from "@testing-library/react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {RankingPage} from "../../src/ui/pages/RankingPage";
const mocks=vi.hoisted(()=>({role:"student",settings:vi.fn(),groups:vi.fn(),group:vi.fn(),global:vi.fn()}));
vi.mock("../../src/infrastructure/store/authStore",()=>({getAuthState:()=>({user:{role:mocks.role}})}));
vi.mock("../../src/infrastructure/api/apiService",()=>({apiService:{groups:{getAll:mocks.groups},courses:{getAll:vi.fn()},modules:{getByCourse:vi.fn()},ranking:{getSettings:mocks.settings,getGlobalRanking:mocks.global,getGroupRanking:mocks.group}}}));
beforeEach(()=>{vi.clearAllMocks();mocks.role="student";mocks.settings.mockResolvedValue({studentVisibility:"CLASSROOM"});mocks.groups.mockResolvedValue([{idGroup:"own",groupName:"Mi aula"}]);mocks.group.mockResolvedValue([{idStudent:"s",studentName:"Alumno del aula",totalPoints:90,position:1}]);mocks.global.mockResolvedValue([{idStudent:"other",studentName:"Alumno global",totalPoints:100,position:1}]);});
afterEach(cleanup);
describe("Configured student rankings",()=>{
  it("defaults to assigned classrooms without requesting global data",async()=>{
    render(<RankingPage/>);expect((await screen.findAllByText("Alumno del aula")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button",{name:"Global"})).not.toBeInTheDocument();expect(screen.queryByRole("button",{name:"Por Curso"})).not.toBeInTheDocument();
    expect(mocks.global).not.toHaveBeenCalled();expect(mocks.group).toHaveBeenCalledWith("own");
  });
  it("hides rankings without fetching student rows",async()=>{
    mocks.settings.mockResolvedValue({studentVisibility:"HIDDEN"});render(<RankingPage/>);
    expect(await screen.findByRole("status")).toHaveTextContent("ocultado");expect(mocks.group).not.toHaveBeenCalled();expect(mocks.global).not.toHaveBeenCalled();
  });
  it("uses the dedicated global endpoint without enumerating other classrooms",async()=>{
    mocks.settings.mockResolvedValue({studentVisibility:"GLOBAL"});render(<RankingPage/>);
    expect((await screen.findAllByText("Alumno global")).length).toBeGreaterThan(0);expect(mocks.global).toHaveBeenCalledTimes(1);expect(mocks.groups).not.toHaveBeenCalled();
  });
  it("does not fall back to a broader scope if configuration fails",async()=>{
    mocks.settings.mockRejectedValue(new Error("offline"));render(<RankingPage/>);expect(await screen.findByRole("alert")).toHaveTextContent("ranking");expect(mocks.global).not.toHaveBeenCalled();expect(mocks.group).not.toHaveBeenCalled();
  });
});
