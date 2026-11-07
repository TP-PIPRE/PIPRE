import {act,cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {Ria01Card} from "../../src/ui/components/ria-bento-grid/cards/Ria01Card";
import {Ria03Card} from "../../src/ui/components/ria-bento-grid/cards/Ria03Card";
import {Ria04Card} from "../../src/ui/components/ria-bento-grid/cards/Ria04Card";
import {Ria08Card} from "../../src/ui/components/ria-bento-grid/cards/Ria08Card";
import {Ria10Card} from "../../src/ui/components/ria-bento-grid/cards/Ria10Card";
import {Ria11Card} from "../../src/ui/components/ria-bento-grid/cards/Ria11Card";
import type {RiaStudentData} from "../../src/ui/components/ria-bento-grid/RiaBentoGrid";
const api=vi.hoisted(()=>Object.fromEntries(["predictRia01","recommendRia03","adjustDifficultyRia04","detectAnomalyRia08","recommendPedagogicalRia10","classifyTimeRia11"].map(key=>[key,vi.fn()])));
vi.mock("../../src/infrastructure/api/aiService",()=>({aiService:api}));
const student:RiaStudentData={id:"one",name:"QA",attempts:3,errors:1,logical_level:"low",ai_interactions:0,inactive_days:0,score:20,success_rate:0.5,help_requested:0,completed_activities:1,age:16,grade:5,rankingPosition:1};
const cases=[
  {Component:Ria01Card,method:"predictRia01",old:{result:"low"},current:{result:"high"},oldText:"30%",text:"90%"},
  {Component:Ria03Card,method:"recommendRia03",old:{reasons:["old analysis"]},current:{reasons:["current analysis"]},oldText:"old analysis",text:"current analysis"},
  {Component:Ria04Card,method:"adjustDifficultyRia04",old:{recommendation:"old analysis"},current:{recommendation:"current analysis"},oldText:"old analysis",text:"current analysis"},
  {Component:Ria08Card,method:"detectAnomalyRia08",old:{reasons:["old analysis"]},current:{reasons:["current analysis"]},oldText:"old analysis",text:"current analysis"},
  {Component:Ria10Card,method:"recommendPedagogicalRia10",old:{details:{reasons:["old analysis"]}},current:{details:{reasons:["current analysis"]}},oldText:"old analysis",text:"current analysis"},
  {Component:Ria11Card,method:"classifyTimeRia11",old:{result:"very_long"},current:{result:"short"},oldText:"Muy lento",text:"Rápido"},
];
beforeEach(()=>vi.resetAllMocks());afterEach(cleanup);
describe.each(cases)("Existing analysis UI $method",({Component,method,old,current,text,oldText})=>{
  it("ignores an old student's response after changing selection",async()=>{
    let finish!:(value:unknown)=>void;
    api[method].mockReturnValueOnce(new Promise(resolve=>{finish=resolve;})).mockResolvedValueOnce(current);
    const view=render(<Component student={student} studentId="one"/>);
    view.rerender(<Component student={{...student,id:"two"}} studentId="two"/>);
    expect(await screen.findByText(text)).toBeVisible();
    await act(async()=>finish(old));
    expect(screen.getByText(text)).toBeVisible();expect(screen.queryByText(oldText)).not.toBeInTheDocument();
  });
  it("announces a failed read and retries without changing its payload",async()=>{
    api[method].mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(current);
    render(<Component student={student} studentId="one"/>);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar");
    fireEvent.click(screen.getByRole("button",{name:"Reintentar"}));
    expect(await screen.findByText(text)).toBeVisible();
    await waitFor(()=>expect(api[method]).toHaveBeenCalledTimes(2));
    expect(api[method].mock.calls[0]).toEqual(api[method].mock.calls[1]);
  });
});
