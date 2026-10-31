import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {NeonFlowStage} from '../../src/ui/components/NeonFlow/NeonFlowStage';
import {NEONFLOW_LEVELS,LEGACY_NEONFLOW_LEVELS} from '../../src/shared/constants/levelConfigs';
import {resolveActivityLevel} from '../../src/application/usecases/activityLevels';
import {useGameStore} from '../../src/infrastructure/store/gameStore';
import {createNeonGrid,neonSolved} from '../../src/application/usecases/neonflow/board';
import {raycast} from '../../src/application/usecases/neonflow/raycast';
import witnesses from '../fixtures/neonFlowSolutions.json';
vi.mock('../../src/infrastructure/api/axiosInstance',()=>({default:{post:vi.fn().mockResolvedValue({status:201})}}));
afterEach(()=>{cleanup();useGameStore.getState().stopGame();});
describe('Integrated Neon Flow catalog',()=>{
  it('keeps both published geometries and separates 30 official versioned boards without runtime solutions',()=>{
    expect(LEGACY_NEONFLOW_LEVELS.map(l=>l.width)).toEqual([5,5]);
    expect(NEONFLOW_LEVELS).toHaveLength(30);
    for(const level of NEONFLOW_LEVELS) {
      expect(level).not.toHaveProperty('solution');
      expect(resolveActivityLevel({idActivity:'test',name:'test',environment:'neonflow',levelTemplate:level.templateId})?.config).toBe(level);
    }
    expect(resolveActivityLevel({idActivity:'test',name:'test',environment:'neonflow',levelTemplate:'neonflow-1'})?.config.width).toBe(5);
  });
  it('does not illuminate a receptor of a different color or pass through a receiver',()=>{
    const level=NEONFLOW_LEVELS[0],grid=createNeonGrid(level);
    grid.cells[2*grid.width+3].color='blue';
    const path=raycast(grid,level.emitter.position,level.emitter.direction,level.emitter.color);
    expect(neonSolved(grid,path,level.emitter.color)).toBe(false);
    expect(path.at(-1)?.type).toBe('RECEPTOR');
  });
  it.each(NEONFLOW_LEVELS)('opens and completes official board $level with the actual controls',level=>{
    render(<MemoryRouter><NeonFlowStage levels={[level]}/></MemoryRouter>);
    for(const placement of witnesses.find(w=>w.templateId===level.templateId)!.placements) {
      fireEvent.click(screen.getByRole('button',{name:placement.type==='MIRROR_90'?'Espejo 90°':`Filtro ${placement.color}`}));
      fireEvent.click(screen.getByRole('button',{name:`Celda vacía, fila ${placement.position.y+1}, columna ${placement.position.x+1}`}));
      for(let angle=0;angle<(placement.rotation??0);angle+=90)fireEvent.click(screen.getByRole('button',{name:new RegExp(`^Rotar espejo, fila ${placement.position.y+1}, columna ${placement.position.x+1},`)}));
    }
    fireEvent.click(screen.getByRole('button',{name:'Comprobar'}));
    expect(useGameStore.getState().status).toBe('SUCCESS');
    expect(screen.getByRole('status')).toHaveTextContent('Todos los receptores están iluminados');
  });
});
