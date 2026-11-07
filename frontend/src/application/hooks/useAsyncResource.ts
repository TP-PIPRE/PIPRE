import {useCallback,useEffect,useEffectEvent,useState} from "react";

/** Include every request input in key; a previous selection's late response is never published. */
export function useAsyncResource<T>(key:string|undefined,load:()=>Promise<T>) {
  const read=useEffectEvent(load);
  const [revision,setRevision]=useState(0);
  const [state,setState]=useState<{key:string;revision:number;data?:T;error?:unknown}>();
  useEffect(()=>{
    if(key===undefined)return;
    let active=true;
    read().then(data=>{if(active)setState({key,revision,data});})
      .catch(error=>{if(active)setState({key,revision,error});});
    return ()=>{active=false;};
  },[key,revision]);
  const current=state?.key===key&&state?.revision===revision?state:undefined;
  return {data:current?.data,error:current?.error,loading:key!==undefined&&!current,
    retry:useCallback(()=>setRevision(value=>value+1),[])};
}
