import {cleanup,render,screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {afterEach,describe,expect,it,vi} from "vitest";
import {AppRouter} from "../../src/ui/router";
const auth=vi.hoisted(()=>({role:"docente" as string|null}));
vi.mock("../../src/infrastructure/store/authStore",()=>({getAuthState:()=>({isAuthenticated:auth.role!==null,user:auth.role?{id:"test",role:auth.role}:null})}));
vi.mock("../../src/ui/components/common/Navbar",()=>({Navbar:()=>null}));
vi.mock("../../src/ui/components/common/AchievementNotification",()=>({AchievementNotification:()=>null}));
vi.mock("../../src/ui/pages/DocenteDashboard",()=>({DocenteDashboard:()=> <h1>Dashboard fixture</h1>}));
vi.mock("../../src/ui/pages/PaginaInicio",()=>({PaginaInicio:()=> <h1>Home fixture</h1>}));
vi.mock("../../src/ui/pages/LoginPage",()=>({LoginPage:()=> <h1>Login fixture</h1>}));
vi.mock("../../src/ui/pages/AdministracionPage",()=>({AdministracionPage:()=> <h1>Administration fixture</h1>}));
afterEach(cleanup);
describe("Route boundaries",()=>{
  it.each(["/docente","/docente/not-a-page"])("uses a visible fallback for %s",async route=>{
    auth.role="docente";render(<MemoryRouter initialEntries={[route]}><AppRouter/></MemoryRouter>);
    expect(await screen.findByText("Dashboard fixture")).toBeInTheDocument();
  });
  it("prevents students from opening staff routes",async()=>{
    auth.role="student";render(<MemoryRouter initialEntries={["/docente/retos"]}><AppRouter/></MemoryRouter>);
    expect(await screen.findByText("Home fixture")).toBeInTheDocument();
  });
  it("redirects anonymous sessions to login",async()=>{
    auth.role=null;render(<MemoryRouter initialEntries={["/perfil"]}><AppRouter/></MemoryRouter>);
    expect(await screen.findByText("Login fixture")).toBeInTheDocument();
  });
  it("prevents teachers from opening administration",async()=>{
    auth.role="docente";render(<MemoryRouter initialEntries={["/docente/administracion"]}><AppRouter/></MemoryRouter>);
    expect(await screen.findByText("Dashboard fixture")).toBeInTheDocument();expect(screen.queryByText("Administration fixture")).not.toBeInTheDocument();
  });
  it("allows administrators to open administration",async()=>{
    auth.role="admin";render(<MemoryRouter initialEntries={["/docente/administracion"]}><AppRouter/></MemoryRouter>);
    expect(await screen.findByText("Administration fixture")).toBeInTheDocument();
  });
});
