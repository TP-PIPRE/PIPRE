import { useCallback, useEffect, useRef } from 'react';
import { AttemptTrace, flushAttemptOutbox, markTracePageExit } from '../../../infrastructure/store/attemptTrace';
import type { TraceAction, TraceContext, TraceData, TracePayload, TraceState } from '../../../infrastructure/store/attemptTrace';
import { getAuthState } from '../../../infrastructure/store/authStore';

export function useAttemptTrace(context:TraceContext|null, initialState:TraceState=[]) {
  const recorder=useRef<AttemptTrace|null>(null);
  const contextKey=JSON.stringify(context), initialKey=JSON.stringify(initialState);
  useEffect(()=>{
    const user=getAuthState().user;
    if(user?.role!=='student'||!user.id||contextKey==='null')return;
    const current=new AttemptTrace(JSON.parse(contextKey),user.id,JSON.parse(initialKey));recorder.current=current;
    void flushAttemptOutbox();
    const leave=()=>{markTracePageExit(true);current.finish('ABANDONED');};
    const resume=()=>{markTracePageExit(false);void flushAttemptOutbox();};
    window.addEventListener('pagehide',leave);window.addEventListener('pageshow',resume);
    return()=>{window.removeEventListener('pagehide',leave);window.removeEventListener('pageshow',resume);current.finish('ABANDONED');recorder.current=null;};
  },[contextKey,initialKey]);
  const record=useCallback((type:TraceAction,data:TraceData={},before?:TraceState,after?:TraceState)=>recorder.current?.record(type,data,before,after),[]);
  const finish=useCallback((result:TracePayload['result'])=>recorder.current?.finish(result),[]);
  return {record,finish};
}
