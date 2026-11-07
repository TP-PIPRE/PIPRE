import {act,cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {AdministracionPage} from "../../src/ui/pages/AdministracionPage";
const api=vi.hoisted(()=>({snapshot:vi.fn(),createClassroom:vi.fn(),teacherClassroom:vi.fn(),teacherCourse:vi.fn(),classroomCourse:vi.fn(),setStudentRankingVisibility:vi.fn(),assignRole:vi.fn(),removeRole:vi.fn(),setUserActive:vi.fn()}));
vi.mock("../../src/infrastructure/api/administrationService",()=>({administrationService:api}));
vi.mock("../../src/infrastructure/api/apiService",()=>({apiService:{ranking:{addToGroup:vi.fn()}}}));
const data={users:[{idUser:"t",firstName:"Ana",lastName:"Docente",email:"t@test.invalid",roles:["TEACHER"]}],groups:[{idGroup:"g",groupName:"Aula uno",description:null}],courses:[{idCourse:"c",name:"Curso uno"}],assignments:[],studentRankingVisibility:"CLASSROOM",roles:[{idRole:"r",name:"TEACHER"}]};
beforeEach(()=>{vi.resetAllMocks();api.snapshot.mockResolvedValue(data);});afterEach(cleanup);
describe("Administration workflows",()=>{
  it("can remove a course binding without treating it as a teacher binding",async()=>{
    api.snapshot.mockResolvedValue({...data,assignments:[{teacherId:null,groupId:"g",courseId:"c"}]});render(<AdministracionPage/>);
    fireEvent.click(await screen.findByRole("button",{name:"Retirar asignación"}));await screen.findByText("Asignación retirada.");
    expect(api.classroomCourse).toHaveBeenCalledWith("g","c",false);expect(api.teacherClassroom).not.toHaveBeenCalled();
  });
  it("shows a rejected role removal and preserves access until the server confirms",async()=>{
    api.removeRole.mockRejectedValue(new Error("Debe conservar al menos un rol"));render(<AdministracionPage/>);await screen.findByLabelText("Usuario");
    fireEvent.change(screen.getByLabelText("Usuario"),{target:{value:"t"}});fireEvent.change(screen.getByLabelText("Rol"),{target:{value:"r"}});
    fireEvent.click(screen.getByRole("button",{name:"Retirar rol"}));expect(await screen.findByRole("alert")).toHaveTextContent("conservar al menos un rol");expect(api.snapshot).toHaveBeenCalledTimes(1);
  });
  it("creates a classroom only after a valid explicit submission",async()=>{
    api.createClassroom.mockResolvedValue({idGroup:"new"});render(<AdministracionPage/>);await screen.findByLabelText("Nombre del aula");
    fireEvent.change(screen.getByLabelText("Nombre del aula"),{target:{value:"Nueva aula"}});fireEvent.change(screen.getByLabelText("Descripción"),{target:{value:"Descripción propia"}});
    fireEvent.submit(screen.getByRole("form",{name:"Crear aula"}));
    expect(await screen.findByText("Aula creada.")).toHaveAttribute("role","status");expect(api.createClassroom).toHaveBeenCalledWith("Nueva aula","Descripción propia");expect(api.teacherClassroom).not.toHaveBeenCalled();
  });
  it("keeps a rejected assignment visible and allows retry",async()=>{
    api.teacherClassroom.mockRejectedValueOnce(new Error("Sin permiso")).mockResolvedValueOnce(undefined);render(<AdministracionPage/>);await screen.findByLabelText("Docente");
    fireEvent.change(screen.getByLabelText("Docente"),{target:{value:"t"}});fireEvent.change(screen.getByLabelText("Aula del docente"),{target:{value:"g"}});
    fireEvent.click(screen.getByRole("button",{name:"Asignar aula al docente"}));expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso");expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"Asignar aula al docente"}));expect(await screen.findByText("Docente asignado al aula.")).toHaveAttribute("role","status");expect(api.teacherClassroom).toHaveBeenCalledTimes(2);
  });
  it("locks the submitted form until the server acknowledges it",async()=>{
    let finish!:(value:unknown)=>void;api.createClassroom.mockReturnValue(new Promise(resolve=>{finish=resolve;}));render(<AdministracionPage/>);await screen.findByLabelText("Nombre del aula");
    fireEvent.change(screen.getByLabelText("Nombre del aula"),{target:{value:"Aula"}});fireEvent.submit(screen.getByRole("form",{name:"Crear aula"}));
    expect(screen.getByRole("button",{name:"Crear aula"})).toBeDisabled();expect(screen.queryByRole("status")).not.toBeInTheDocument();await act(async()=>finish({idGroup:"new"}));expect(await screen.findByRole("status")).toHaveTextContent("Aula creada");
  });
  it("shows the persisted default and saves only the selected ranking visibility",async()=>{
    api.setStudentRankingVisibility.mockResolvedValue(undefined);render(<AdministracionPage/>);const select=await screen.findByLabelText("Visibilidad para estudiantes");expect(select).toHaveValue("CLASSROOM");fireEvent.change(select,{target:{value:"HIDDEN"}});fireEvent.click(screen.getByRole("button",{name:"Guardar visibilidad"}));await waitFor(()=>expect(api.setStudentRankingVisibility).toHaveBeenCalledWith("HIDDEN"));
  });
});
