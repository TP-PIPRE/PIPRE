import type { Cell, Grid, NeonFlowLevelConfig } from '../../../shared/types/NeonFlow';
export function createNeonGrid(level:NeonFlowLevelConfig):Grid {
  const cells:Cell[]=Array.from({length:level.width*level.height},(_,i)=>({x:i%level.width,y:Math.floor(i/level.width),type:'EMPTY'}));
  for(const block of level.blocked)cells[block.y*level.width+block.x]={...block,type:'BLOCK'};
  for(const receptor of level.receptors)cells[receptor.position.y*level.width+receptor.position.x]={...receptor.position,type:'RECEPTOR',color:receptor.color};
  return {width:level.width,height:level.height,cells};
}
export function neonSolved(grid:Grid,path:Cell[],color?:string) {
  const targets=grid.cells.filter(c=>c.type==='RECEPTOR');
  return targets.length>0&&targets.every(r=>r.color===color&&path.some(p=>p.type==='RECEPTOR'&&p.x===r.x&&p.y===r.y&&p.color===color));
}
