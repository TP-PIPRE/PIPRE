import {act,cleanup,render,screen,waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {Navbar} from "../../src/ui/components/common/Navbar";
import {useAchievementStore} from "../../src/infrastructure/store/achievementStore";
const api=vi.hoisted(()=>({profile:vi.fn()}));
vi.mock("../../src/infrastructure/api/apiService",()=>({apiService:{profile:{get:api.profile}}}));
vi.mock("../../src/infrastructure/store/authStore",()=>({getAuthState:()=>({user:{id:"student",name:"Student",email:"student@test.invalid",role:"student"},isAuthenticated:true})}));
vi.mock("../../src/application/hooks/useAuth",()=>({useAuth:()=>({logout:vi.fn()})}));
beforeEach(()=>{vi.resetAllMocks();useAchievementStore.setState({revisions:{},notifications:[],seen:{}});});
afterEach(cleanup);
it("refreshes the header from the server after confirmed progress",async()=>{
  api.profile.mockResolvedValueOnce({level:1,totalStars:0}).mockResolvedValueOnce({level:2,totalStars:10});
  render(<MemoryRouter><Navbar/></MemoryRouter>);expect(await screen.findByText(/Nivel 1/)).toBeInTheDocument();
  act(()=>useAchievementStore.setState({revisions:{student:1}}));
  await waitFor(()=>expect(api.profile).toHaveBeenCalledTimes(2));expect(await screen.findByText(/Nivel 2/)).toBeInTheDocument();
});
