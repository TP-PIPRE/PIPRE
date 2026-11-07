import {useState} from "react";
import {useSearchParams} from "react-router-dom";

/** Practice keeps its board in the URL so a reload opens the same persisted session. */
export function useBoardSelection(levels:readonly {level:number}[],practice:boolean) {
  const [local,setLocal]=useState(0);
  const [search,setSearch]=useSearchParams();
  const level=search.get("level");
  const urlIndex=level&&/^[1-9]\d*$/.test(level)?levels.findIndex(candidate=>candidate.level===Number(level)):-1;
  const index=practice?Math.max(0,urlIndex):local;
  return [index,(next:number)=>{
    if(!levels[next])return;
    if(!practice){setLocal(next);return;}
    setSearch(previous=>{const updated=new URLSearchParams(previous);updated.set("level",String(levels[next].level));return updated;},{replace:true});
  }] as const;
}
