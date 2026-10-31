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
vi.mock('../../src/infrastructure/api/axiosInstance',()=>({default:{post:vi.fn().mockResolvedValue({status:201})}}));
vi.mock('../../src/infrastructure/store/authStore',()=>({getAuthState:vi.fn(()=>({user:{id:'student-test',role:'student'},isAuthenticated:true}))}));
afterEach(async()=>{cleanup();useGameStore.getState().stopGame();await flushAttemptOutbox();vi.clearAllMocks();});
const context={game:'tetrilogic' as const,activityId:'act-c002-1',levelTemplate:'tetrilogic-v2-1',templateVersion:2,ruleset:'tetrilogic-counts-v1'};
describe('Learning process trace',()=>{
  it('sends once, separates static help from IA and starts another episode with the actual prior board',()=>{
    const send=vi.fn(),t=new AttemptTrace(context,'student-test',[],send);
    const piece={id:'o1',type:'O',x:0,y:0,rotation:0};
    t.record('PLACE',{pieceId:'o1'},[],[piece]);t.record('HELP',{source:'STATIC'});t.finish('SUCCESS');t.finish('SUCCESS');
    expect(send).toHaveBeenCalledTimes(1);
    const first=send.mock.calls[0][0];expect(first.pistasIa).toBe(0);expect(first.trace.events.map((e:{sequence:number})=>e.sequence)).toEqual([1,2,3]);
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
    expect(axios.post).toHaveBeenCalledTimes(1);expect(axios.post).toHaveBeenCalledWith('telemetry',expect.objectContaining({result:'SUCCESS',pistasIa:0,trace:expect.objectContaining({activityId:'act-c001-v2-1',ruleset:'neonflow-raycast-v1'})}),{skipAuthRedirect:true});
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
});
