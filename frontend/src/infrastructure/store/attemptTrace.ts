import axiosInstance from '../api/axiosInstance';
import { getAuthState } from './authStore';

export type TraceState = Array<{id?:string;type:string;x:number;y:number;rotation?:number;color?:string}>;
export type TraceAction = 'SELECT'|'PLACE'|'ROTATE'|'RETURN'|'RESET'|'CHECK'|'HELP'|'REJECT'|'CANCEL'|'COMPLETE'|'ABANDON';
export type TraceData = Partial<{pieceId:string;pieceType:string;x:number;y:number;rotation:number;component:string;color:string;errorCode:string;source:string;matched:boolean}>;
export interface TraceContext { game:'neonflow'|'tetrilogic'; activityId?:string; levelTemplate:string; templateVersion:number; ruleset:string }
export interface TracePayload {
  studentId:string;game:string;result:'SUCCESS'|'FAILED'|'ABANDONED';tiempoResolucion:number;movimientos:number;reinicios:number;pistasIa:number;completedAt:string;
  trace:Omit<TraceContext,'game'> & {clientAttemptId:string;startedAt:string;initialState:TraceState;finalState:TraceState;droppedEvents:number;events:Array<{sequence:number;elapsedMs:number;type:TraceAction;data:TraceData}>};
}
const storageKey='pipre.attempt-outbox.v1';
const pending=new Map<string,TracePayload>();
let restored=false, flushing=false;
let pageExiting=false;
export function markTracePageExit(value:boolean) { pageExiting=value; }
function persist() { try { sessionStorage.setItem(storageKey,JSON.stringify([...pending])); } catch { /* In-memory retry remains available if storage is full/disabled. */ } }
function restore() {
  if(restored)return;restored=true;
  try { const entries:unknown=JSON.parse(sessionStorage.getItem(storageKey)??'[]');if(Array.isArray(entries))for(const entry of entries)if(Array.isArray(entry)&&typeof entry[0]==='string'&&entry[1]?.trace?.clientAttemptId)pending.set(entry[0],entry[1]); } catch { /* Invalid local cache never changes a game. */ }
}
export async function flushAttemptOutbox() {
  restore();if(flushing)return;flushing=true;
  try {
    for(const [key,payload] of pending) {
      const user=getAuthState().user;if(user?.id!==payload.studentId||user.role!=='student')continue;
      const keepalive=pageExiting&&new TextEncoder().encode(JSON.stringify(payload)).length<60000;
      try { await axiosInstance.post('telemetry',payload,{skipAuthRedirect:true,...(keepalive?{adapter:'fetch' as const,fetchOptions:{keepalive:true}}:{})});pending.delete(key);persist(); }
      catch { break; } // Keep the exact request and id for a later authenticated retry.
    }
  } finally { flushing=false; }
}
function enqueue(payload:TracePayload) { restore();pending.set(`${payload.studentId}:${payload.trace.clientAttemptId}`,payload);persist();void flushAttemptOutbox(); }

/** Observed episodes re-open on the first board mutation after success. No academic score. */
export class AttemptTrace {
  private id=''; private startedAt=0; private clock=0; private events:TracePayload['trace']['events']=[];
  private initial:TraceState=[]; private current:TraceState=[]; private dropped=0; private finished=false;
  private context:TraceContext; private studentId:string; private send:(payload:TracePayload)=>void;
  constructor(context:TraceContext, studentId:string, initial:TraceState, send:(payload:TracePayload)=>void=enqueue) {this.context=context;this.studentId=studentId;this.send=send;this.begin(initial);}
  private begin(state:TraceState) { this.id=crypto.randomUUID();this.startedAt=Date.now();this.clock=performance.now();this.initial=structuredClone(state);this.current=structuredClone(state);this.events=[];this.dropped=0;this.finished=false; }
  record(type:TraceAction,data:TraceData={},before?:TraceState,after?:TraceState) {
    if(this.finished) { if(!['PLACE','ROTATE','RETURN','RESET'].includes(type))return;this.begin(before??this.current); }
    if(after)this.current=structuredClone(after);
    if(this.events.length>=4999){this.dropped++;return;}
    const elapsedMs=Math.max(this.events.at(-1)?.elapsedMs??0,Math.round(performance.now()-this.clock));
    this.events.push({sequence:this.events.length+1,elapsedMs,type,data:{...data}});
  }
  finish(result:TracePayload['result']) {
    if(this.finished||!this.events.length)return;
    this.record(result==='SUCCESS'?'COMPLETE':'ABANDON');this.finished=true;
    const elapsed=Math.max(0,Math.round(performance.now()-this.clock));
    const {game,...context}=this.context;
    this.send({studentId:this.studentId,game,result,tiempoResolucion:Math.floor(elapsed/1000),
      movimientos:this.events.filter(e=>['PLACE','ROTATE','RETURN'].includes(e.type)).length,
      reinicios:this.events.filter(e=>e.type==='RESET').length,pistasIa:this.events.filter(e=>e.type==='HELP'&&e.data.source==='AI').length,
      completedAt:new Date(this.startedAt+elapsed).toISOString(),trace:{...context,clientAttemptId:this.id,startedAt:new Date(this.startedAt).toISOString(),initialState:this.initial,finalState:this.current,droppedEvents:this.dropped,events:structuredClone(this.events)}});
  }
}
