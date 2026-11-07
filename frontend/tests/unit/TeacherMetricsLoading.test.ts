import {beforeEach,describe,expect,it,vi} from "vitest";
import {loadTeacherMetrics,summarizeModule} from "../../src/application/usecases/loadTeacherMetrics";
import type {StudentMetrics} from "../../src/application/usecases/loadTeacherMetrics";
const api=vi.hoisted(()=>({groups:vi.fn(),courses:vi.fn(),ranking:vi.fn(),risk:vi.fn(),progress:vi.fn(),results:vi.fn(),modules:vi.fn(),lessons:vi.fn(),activities:vi.fn()}));
vi.mock("../../src/infrastructure/api/apiService",()=>({apiService:{groups:{getAll:api.groups},courses:{getAll:api.courses},ranking:{getGroupRanking:api.ranking},analytics:{getDropoutRisk:api.risk,getProgressByUser:api.progress},results:{getByUser:api.results},modules:{getByCourse:api.modules},lessons:{getByModule:api.lessons},activities:{getByLesson:api.activities}}}));
const result=(score:number|null)=>({idResult:"result",idStudent:"student",idActivity:"a1",score,dateAttempted:"2026-11-06T12:00:00",attempts:1});
const module={idModule:"m1",title:"Module",courseName:"Course",activityIds:["a1"]};
function metric(scores:Array<number|null>):StudentMetrics {
  return {student:{idStudent:"student",studentName:"Student",position:1,totalPoints:0},risk:null,progress:[],results:scores.map(result),errors:[]};
}
beforeEach(()=>{
  vi.resetAllMocks();api.groups.mockResolvedValue([{idGroup:"g1"},{idGroup:"g2"}]);api.courses.mockResolvedValue([{idCourse:"c1",name:"Course"}]);
  api.ranking.mockResolvedValue([{idStudent:"student",studentName:"Student",position:1,totalPoints:0}]);
  api.risk.mockRejectedValue(Object.assign(new Error("No risk evaluation"),{isAxiosError:true,response:{status:404}}));
  api.progress.mockResolvedValue([]);api.results.mockResolvedValue([result(80)]);api.modules.mockResolvedValue([{idModule:"m1",title:"Module"}]);api.lessons.mockResolvedValue([{idLesson:"l1"}]);api.activities.mockResolvedValue([{idActivity:"a1"}]);
});
describe("Academic data provenance",()=>{
  it("keeps an unknown score distinct from a measured zero",()=>{
    const summary=summarizeModule(module,[metric([null])]);expect(summary.averageScore).toBeNull();expect(summary.resultCount).toBe(1);
  });
  it("averages only known scores while retaining the full result count",()=>{
    const summary=summarizeModule(module,[metric([80,null])]);expect(summary.averageScore).toBe(80);expect(summary.resultCount).toBe(2);
  });
  it("loads a student once across memberships and follows the curricular relationships",async()=>{
    const loaded=await loadTeacherMetrics();expect(loaded.students).toHaveLength(1);expect(api.results).toHaveBeenCalledTimes(1);
    expect(loaded.students[0].errors).toEqual([]);expect(loaded.modules[0].averageScore).toBe(80);expect(loaded.courseCount).toBe(1);
  });
  it("preserves partial-read errors without inventing an evaluation",async()=>{
    api.risk.mockRejectedValue(new Error("offline"));api.progress.mockRejectedValue(new Error("offline"));api.results.mockRejectedValue(new Error("offline"));
    const loaded=await loadTeacherMetrics();expect(loaded.students[0].risk).toBeNull();expect(loaded.students[0].errors).toEqual(["análisis","progreso","resultados"]);expect(loaded.modules[0].averageScore).toBeNull();
  });
});
