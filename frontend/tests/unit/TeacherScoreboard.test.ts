import {beforeEach,describe,expect,it,vi} from "vitest";
import {loadTeacherScoreboard} from "../../src/application/usecases/loadTeacherScoreboard";
const api=vi.hoisted(()=>({groups:vi.fn(),courses:vi.fn(),ranking:vi.fn(),profile:vi.fn(),progress:vi.fn(),risk:vi.fn()}));
vi.mock("../../src/infrastructure/api/apiService",()=>({apiService:{groups:{getAll:api.groups},courses:{getAll:api.courses},ranking:{getGroupRanking:api.ranking},profile:{get:api.profile},analytics:{getDropoutRisk:api.risk}}}));
vi.mock("../../src/infrastructure/api/gameProgressService",()=>({gameProgressService:{progress:api.progress}}));
const progress={levels:["neonflow","tetrilogic"].flatMap(game=>Array.from({length:30},(_,index)=>({game,levelNumber:index+1,completed:false,bestStars:0}))),totalLevels:60,completedLevels:0};
beforeEach(()=>{
  vi.resetAllMocks();api.groups.mockResolvedValue([{idGroup:"g1"},{idGroup:"g2"}]);api.courses.mockResolvedValue([]);api.ranking.mockResolvedValue([{idStudent:"s",studentName:"Student",position:1,totalPoints:90}]);api.profile.mockResolvedValue({idStudent:"s",totalPoints:90,xpTotal:50});api.progress.mockResolvedValue(progress);api.risk.mockRejectedValue(Object.assign(new Error("missing"),{isAxiosError:true,response:{status:404}}));
});
describe("Verified teacher scoreboard",()=>{
  it("deduplicates visible memberships and keeps points separate from XP",async()=>{
    const data=await loadTeacherScoreboard();expect(data.students).toHaveLength(1);expect(data.students[0].profile).toEqual({idStudent:"s",totalPoints:90,xpTotal:50});expect(data.students[0].risk).toBeNull();expect(data.students[0].errors).toEqual([]);expect(api.profile).toHaveBeenCalledTimes(1);
  });
  it("preserves valid zero totals rather than treating them as missing",async()=>{
    api.profile.mockResolvedValue({idStudent:"s",totalPoints:0,xpTotal:0});const data=await loadTeacherScoreboard();expect(data.students[0].profile?.totalPoints).toBe(0);expect(data.students[0].errors).toEqual([]);
  });
  it("does not fabricate a zero profile on permission or network failure",async()=>{
    api.profile.mockRejectedValue(new Error("forbidden"));const data=await loadTeacherScoreboard();expect(data.students[0].profile).toBeNull();expect(data.students[0].progress).toEqual(progress);expect(data.students[0].errors).toContain("puntaje/XP");
  });
  it("rejects inconsistent progress or another student's profile as partial data",async()=>{
    api.profile.mockResolvedValue({idStudent:"other",totalPoints:90,xpTotal:50});api.progress.mockResolvedValue({...progress,levels:[]});const data=await loadTeacherScoreboard();expect(data.students[0].profile).toBeNull();expect(data.students[0].progress).toBeNull();expect(data.students[0].errors).toEqual(["puntaje/XP","progreso"]);
  });
  it("surfaces a failed classroom read without returning an empty roster",async()=>{
    api.ranking.mockRejectedValue(new Error("offline"));await expect(loadTeacherScoreboard()).rejects.toThrow("offline");
  });
});
