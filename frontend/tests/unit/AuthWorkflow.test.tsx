import {act,cleanup,renderHook} from "@testing-library/react";
import {MemoryRouter,useLocation} from "react-router-dom";
import type {ReactNode} from "react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {useAuth} from "../../src/application/hooks/useAuth";
import {clearAuthState,getAuthState,setAuthState} from "../../src/infrastructure/store/authStore";
const mocks=vi.hoisted(()=>({login:vi.fn(),register:vi.fn(),logout:vi.fn()}));
vi.mock("../../src/infrastructure/adapters/http/AuthAdapter",()=>({AuthAdapter:class {login=mocks.login;register=mocks.register;logout=mocks.logout;}}));
const user={id:"student",email:"student@test.invalid",name:"Student",role:"student" as const};
function open(){return renderHook(()=>({auth:useAuth(),location:useLocation()}),{wrapper:({children}:{children:ReactNode})=><MemoryRouter initialEntries={["/login"]}>{children}</MemoryRouter>});}
beforeEach(()=>{vi.resetAllMocks();clearAuthState();});afterEach(()=>{cleanup();clearAuthState();});
describe("Authentication orchestration",()=>{
  it.each(["student","docente","admin"] as const)("uses the server role %s for navigation",async role=>{
    mocks.login.mockResolvedValue({user:{...user,role}});const {result}=open();
    await act(()=>result.current.auth.login(user.email,"private"));
    expect(result.current.location.pathname).toBe(role==="student"?"/":"/docente/dashboard");expect(getAuthState().user?.role).toBe(role);
  });
  it("does not discard the session when logout fails",async()=>{
    setAuthState(user);mocks.logout.mockRejectedValue(new Error("offline"));const {result}=open();
    await expect(result.current.auth.logout()).rejects.toThrow("offline");expect(getAuthState().isAuthenticated).toBe(true);
    mocks.logout.mockResolvedValue(undefined);await act(()=>result.current.auth.logout());expect(getAuthState().isAuthenticated).toBe(false);expect(result.current.location.pathname).toBe("/login");
  });
  it("propagates failed login and registration without manufacturing a user",async()=>{
    mocks.login.mockRejectedValue(new Error("invalid"));mocks.register.mockRejectedValue(new Error("duplicate"));const {result}=open();
    await expect(result.current.auth.login(user.email,"private")).rejects.toThrow("invalid");
    await expect(result.current.auth.register("A","B",user.email,"private",16,"QA")).rejects.toThrow("Error al registrar: duplicate");expect(getAuthState().user).toBeNull();
  });
  it("returns registration results from the adapter",async()=>{
    mocks.register.mockResolvedValue(user);const {result}=open();expect(await result.current.auth.register("A","B",user.email,"private",16,"QA")).toEqual(user);
    expect(mocks.register).toHaveBeenCalledWith("A","B",user.email,"private",16,"QA");
  });
});
