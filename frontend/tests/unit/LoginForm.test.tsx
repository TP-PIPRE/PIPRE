import {act,cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {LoginPage} from "../../src/ui/pages/LoginPage";
const mocks=vi.hoisted(()=>({login:vi.fn(),create:vi.fn()}));
vi.mock("../../src/application/hooks/useAuth",()=>({useAuth:()=>({login:mocks.login})}));
vi.mock("../../src/infrastructure/api/apiService",()=>({apiService:{users:{create:mocks.create}}}));
beforeEach(()=>{vi.resetAllMocks();});afterEach(()=>{cleanup();vi.restoreAllMocks();});
function fields(){fireEvent.change(screen.getByLabelText("Correo electrónico"),{target:{value:"student@test.invalid"}});fireEvent.change(screen.getByLabelText("Contraseña"),{target:{value:"private-password"}});}
function submit(){fireEvent.submit(screen.getByRole("button",{name:"Iniciar sesión"}).closest("form")!);}
describe("Login form",()=>{
  it("shows pending state until the actual authentication promise resolves",async()=>{
    let finish!:()=>void;mocks.login.mockReturnValue(new Promise<void>(r=>{finish=r;}));render(<LoginPage/>);fields();submit();
    expect(screen.getByRole("button",{name:"Conectando…"})).toBeDisabled();expect(mocks.login).toHaveBeenCalledWith("student@test.invalid","private-password");
    await act(async()=>finish());expect(screen.getByRole("button",{name:"Iniciar sesión"})).toBeEnabled();
  });
  it("announces failure without logging an error object containing request credentials",async()=>{
    const error=Object.assign(new Error("Credenciales inválidas"),{cause:{config:{data:{password:"private-password"}}}});
    mocks.login.mockRejectedValue(error);const log=vi.spyOn(console,"error").mockImplementation(()=>{});render(<LoginPage/>);fields();submit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales inválidas");expect(log).not.toHaveBeenCalledWith(expect.anything(),error);
    expect(screen.getByRole("alert")).toHaveFocus();
  });
  it("keeps registration compatible with an empty 201 response",async()=>{
    mocks.create.mockResolvedValue("");render(<LoginPage/>);fireEvent.click(screen.getByRole("button",{name:/Regístrate aquí/}));fields();
    for(const [label,value] of [["Nombre","QA"],["Apellido","Student"],["Edad","16"],["Grado","QA"]])fireEvent.change(screen.getByLabelText(label),{target:{value}});
    fireEvent.submit(screen.getByRole("button",{name:"Crear cuenta"}).closest("form")!);
    expect(await screen.findByRole("status")).toHaveTextContent("Tu cuenta está lista");expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({roleIdList:[],firstName:"QA"}));
  });
  it("renders an untrusted error as text instead of HTML",async()=>{
    const log=vi.spyOn(console,"error").mockImplementation(()=>{});mocks.login.mockRejectedValue(new Error('<img src=x onerror="alert(1)">'));render(<LoginPage/>);fields();submit();
    await waitFor(()=>expect(screen.getByRole("alert")).toHaveTextContent("<img"));expect(document.querySelector("#auth-error img")).toBeNull();expect(log).toHaveBeenCalled();
  });
});
