import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {AttemptTrace,flushAttemptOutbox} from '../../src/infrastructure/store/attemptTrace';
import {NeonFlowStage} from '../../src/ui/components/NeonFlow/NeonFlowStage';
import {NEONFLOW_LEVELS,TETRILOGIC_LEVELS} from '../../src/shared/constants/levelConfigs';
import {TetriLogicStage} from '../../src/ui/components/TetriLogic/TetriLogicStage';
import {getAuthState} from '../../src/infrastructure/store/authStore';
import axios from '../../src/infrastructure/api/axiosInstance';
import {useGameStore} from '../../src/infrastructure/store/gameStore';
import {AxiosError,AxiosHeaders} from 'axios';
vi.mock('../../src/infrastructure/api/axiosInstance',()=>({default:{post:vi.fn().mockResolvedValue({status:201})}}));
vi.mock('../../src/infrastructure/store/authStore',()=>({getAuthState:vi.fn(()=>({user:{id:'student-test',role:'student'},isAuthenticated:true}))}));
vi.mock('../../src/ui/components/common/useValidatedGameSession',()=>{
  const session={enabled:false,state:null,ready:true,verifying:false,action:()=>{},complete:()=>{},retry:()=>{},reset:()=>{}};
  return {useValidatedGameSession:()=>session};
});
afterEach(async()=>{cleanup();useGameStore.getState().stopGame();await flushAttemptOutbox();vi.clearAllMocks();});
const context={game:'tetrilogic' as const,activityId:'act-c002-1',levelTemplate:'tetrilogic-v2-1',templateVersion:2,ruleset:'tetrilogic-counts-v1'};
describe('Learning process trace',()=>{
   it('sends once, counts delivered static help and starts another episode with the actual prior board',()=>{
    const send=vi.fn(),t=new AttemptTrace(context,'student-test',[],send);
    const piece={id:'o1',type:'O',x:0,y:0,rotation:0};
    t.record('PLACE',{pieceId:'o1'},[],[piece]);t.record('HELP',{source:'STATIC'});t.finish('SUCCESS');t.finish('SUCCESS');
    expect(send).toHaveBeenCalledTimes(1);
     const first=send.mock.calls[0][0];expect(first.pistasIa).toBe(1);expect(first.trace.events.map((e:{sequence:number})=>e.sequence)).toEqual([1,2,3]);
    t.record('SELECT',{pieceId:'o1'});t.record('RETURN',{pieceId:'o1'},[piece],[]);t.finish('ABANDONED');
    expect(send).toHaveBeenCalledTimes(2);expect(send.mock.calls[1][0].trace.initialState).toEqual([piece]);
    expect(send.mock.calls[1][0].trace.clientAttemptId).not.toBe(first.trace.clientAttemptId);
  });
  it('ignores empty StrictMode visits and records bounded truncation explicitly',()=>{
    const send=vi.fn(),t=new AttemptTrace(context,'student-test',[],send);t.finish('ABANDONED');expect(send).not.toHaveBeenCalled();
    for(let i=0;i<5005;i++)t.record('SELECT');t.finish('ABANDONED');
    expect(send.mock.calls[0][0].trace.events.length).toBeLessThanOrEqual(5000);expect(send.mock.calls[0][0].trace.droppedEvents).toBeGreaterThan(0);
  });
  it('records Neon Flow success with its selected activity and no duplicate legacy submission',async()=>{
    render(<MemoryRouter><NeonFlowStage levels={[NEONFLOW_LEVELS[0]]} activity={{idActivity:'act-c001-v2-1',name:'First',environment:'neonflow',levelTemplate:'neonflow-v2-1'}}/></MemoryRouter>);
    fireEvent.click(screen.getByRole('button',{name:'Pista'}));fireEvent.click(screen.getByRole('button',{name:'Comprobar'}));await flushAttemptOutbox();
     expect(axios.post).toHaveBeenCalledTimes(1);expect(axios.post).toHaveBeenCalledWith('telemetry',expect.objectContaining({result:'SUCCESS',pistasIa:1,trace:expect.objectContaining({activityId:'act-c001-v2-1',ruleset:'neonflow-raycast-v1'})}),{skipAuthRedirect:true});
  });
  it('starts a distinct observed episode when restarting a solved Neon Flow activity',async()=>{
    render(<MemoryRouter><NeonFlowStage levels={[NEONFLOW_LEVELS[0]]} activity={{idActivity:'act-c001-v2-1',name:'First',environment:'neonflow',levelTemplate:'neonflow-v2-1'}}/></MemoryRouter>);
    fireEvent.click(screen.getByRole('button',{name:'Comprobar'}));await flushAttemptOutbox();
    fireEvent.click(screen.getByRole('button',{name:'Reiniciar'}));
    fireEvent.click(screen.getByRole('button',{name:'Comprobar'}));await flushAttemptOutbox();
    const payloads=vi.mocked(axios.post).mock.calls.map(call=>call[1]) as Array<{result:string;reinicios:number;trace:{clientAttemptId:string;events:Array<{type:string}>}}>;
    expect(payloads).toHaveLength(2);
    expect(payloads[0].result).toBe('SUCCESS');expect(payloads[1].result).toBe('SUCCESS');
    expect(payloads[1].reinicios).toBe(1);
    expect(payloads[1].trace.clientAttemptId).not.toBe(payloads[0].trace.clientAttemptId);
    expect(payloads[1].trace.events.map(event=>event.type)).toEqual(['RESET','CHECK','COMPLETE']);
  });
  it('records TetriLogic abandonment with rejected and accepted manipulations without scoring',async()=>{
    const view=render(<MemoryRouter><TetriLogicStage levels={[TETRILOGIC_LEVELS[0]]} activity={{idActivity:'act-c002-1',name:'First',levelTemplate:'tetrilogic-v2-1'}}/></MemoryRouter>);
    fireEvent.click(screen.getByRole('button',{name:'Seleccionar pieza O (o1)'}));fireEvent.click(screen.getByRole('button',{name:'Celda vacía, fila 4, columna 4'}));fireEvent.click(screen.getByRole('button',{name:'Celda vacía, fila 1, columna 1'}));view.unmount();await flushAttemptOutbox();
    const payload=vi.mocked(axios.post).mock.calls.at(-1)![1] as {trace:{events:Array<{type:string}>}};
    expect(payload.trace.events.map(e=>e.type)).toEqual(expect.arrayContaining(['REJECT','PLACE','ABANDON']));expect(payload).not.toHaveProperty('score');
  });
  it('does not submit observations for a different authenticated student',async()=>{
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('offline'));
    render(<MemoryRouter><NeonFlowStage levels={[NEONFLOW_LEVELS[0]]}/></MemoryRouter>);fireEvent.click(screen.getByRole('button',{name:'Comprobar'}));
    await flushAttemptOutbox();vi.mocked(getAuthState).mockReturnValueOnce({user:{id:'other-student',role:'student'},isAuthenticated:true});
    const calls=vi.mocked(axios.post).mock.calls.length;await flushAttemptOutbox();expect(axios.post).toHaveBeenCalledTimes(calls);
  });
  it.each([400,404,409,422])('keeps an HTTP %s rejection without blocking a subsequent valid episode',async status=>{
    const post=vi.mocked(axios.post);
    post.mockImplementation(async(_url,payload)=>{
      if(payload.trace.activityId==='outdated-activity')throw new AxiosError('Rejected','ERR_BAD_REQUEST',undefined,undefined,{status,data:{},statusText:'Rejected',headers:{},config:{headers:new AxiosHeaders()}});
      return {status:201};
    });
    const outdated=new AttemptTrace({...context,activityId:'outdated-activity'},'student-test',[]);
    const valid=new AttemptTrace(context,'student-test',[]);
    outdated.record('SELECT');outdated.finish('ABANDONED');
    valid.record('SELECT');valid.finish('ABANDONED');
    await vi.waitFor(()=>expect(post.mock.calls.some(call=>call[1].trace.activityId===context.activityId)).toBe(true));
    expect(post).toHaveBeenCalledTimes(2);
    const rejected=post.mock.calls[0][1];
    post.mockClear();post.mockResolvedValue({status:201});
    await flushAttemptOutbox();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][1]).toEqual(rejected); // Same UUID/body; accepted successor is already removed.
  });
});
