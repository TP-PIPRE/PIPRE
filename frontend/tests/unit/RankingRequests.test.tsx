import {act,cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {RankingPage} from "../../src/ui/pages/RankingPage";
import type {RankingDTO} from "../../src/infrastructure/api/models/apiModels";
const api=vi.hoisted(()=>({groups:vi.fn(),courses:vi.fn(),modules:vi.fn(),group:vi.fn(),course:vi.fn(),module:vi.fn()}));
vi.mock("../../src/infrastructure/api/apiService",()=>({apiService:{groups:{getAll:api.groups},courses:{getAll:api.courses},modules:{getByCourse:api.modules},ranking:{getGroupRanking:api.group,getCourseRanking:api.course,getModuleRanking:api.module}}}));
vi.mock("../../src/infrastructure/store/authStore",()=>({getAuthState:()=>({user:{role:"docente"}})}));
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return {promise,resolve};}
const row=(name:string):RankingDTO=>({idStudent:name,studentName:name,position:1,totalPoints:10});
beforeEach(()=>{
  vi.resetAllMocks();api.groups.mockResolvedValue([{idGroup:"g1",groupName:"Group"}]);api.courses.mockResolvedValue([{idCourse:"c1",name:"Course 1"},{idCourse:"c2",name:"Course 2"}]);api.modules.mockResolvedValue([]);api.group.mockResolvedValue([]);api.course.mockResolvedValue([]);
});
afterEach(cleanup);
describe("Ranking request consistency",()=>{
  it("keeps course data available when the unrelated groups API is unavailable",async()=>{
    api.groups.mockRejectedValue(new Error("offline"));api.course.mockResolvedValue([row("Course independent")]);
    render(<RankingPage/>);fireEvent.click(screen.getByRole("button",{name:"Por Curso"}));
    expect((await screen.findAllByText("Course independent")).length).toBeGreaterThan(0);expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("does not refetch the course when an unrelated group list arrives",async()=>{
    const groups=deferred<unknown[]>();api.groups.mockReturnValue(groups.promise);api.course.mockResolvedValue([row("Course independent")]);
    render(<RankingPage/>);fireEvent.click(screen.getByRole("button",{name:"Por Curso"}));await screen.findAllByText("Course independent");
    await act(async()=>groups.resolve([{idGroup:"g1",groupName:"Late group"}]));expect(api.course).toHaveBeenCalledTimes(1);
  });
  it("does not replace the selected course with a late global response",async()=>{
    const old=deferred<RankingDTO[]>();api.group.mockReturnValue(old.promise);api.course.mockResolvedValue([row("Current course")]);
    render(<RankingPage/>);await waitFor(()=>expect(api.group).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button",{name:"Por Curso"}));expect((await screen.findAllByText("Current course")).length).toBeGreaterThan(0);
    await act(async()=>old.resolve([row("Obsolete global")]));
    expect(screen.getAllByText("Current course")[0]).toBeVisible();expect(screen.queryByText("Obsolete global")).not.toBeInTheDocument();
  });
  it("distinguishes an unavailable ranking from an empty ranking",async()=>{
    api.groups.mockRejectedValue(new Error("Service unavailable"));render(<RankingPage/>);
    expect(await screen.findByRole("alert")).toHaveTextContent(/ranking/i);
    expect(screen.queryByText(/Todavía no hay estudiantes/i)).not.toBeInTheDocument();
  });
  it("ignores old module lists when changing courses",async()=>{
    const old=deferred<unknown[]>();api.modules.mockImplementation((id:string)=>id==="c1"?old.promise:Promise.resolve([{idModule:"m2",title:"Current module"}]));
    render(<RankingPage/>);fireEvent.click(screen.getByRole("button",{name:"Por Curso"}));
    const course=await screen.findByLabelText("Filtrar por curso");await waitFor(()=>expect(api.modules).toHaveBeenCalledWith("c1"));
    fireEvent.change(course,{target:{value:"c2"}});expect(await screen.findByRole("option",{name:"Current module"})).toBeInTheDocument();
    await act(async()=>old.resolve([{idModule:"m1",title:"Obsolete module"}]));
    expect(screen.getByRole("option",{name:"Current module"})).toBeInTheDocument();expect(screen.queryByText("Obsolete module")).not.toBeInTheDocument();
  });
});
