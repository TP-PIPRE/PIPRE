import React, { createContext, useContext, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Block, BlockCategory } from '../../domain/models/Simulador';
import type { ISimulatorEngine } from '../../domain/ports/ISimulatorEngine';

interface LogEntry {
  time: string;
  msg: string;
  type: 'info' | 'warn' | 'error' | 'success';
}

export interface Mission {
  id: string;
  title: string;
  objective: string;
  isCompleted: boolean;
  maxBlocks: number;
}

interface SimuladorContextType {
  installedHardware: string[];
  installHardware: (id: string) => void;
  uninstallHardware: (id: string) => void;
  
  blocks: Block[];
  addBlock: (type: string, category: BlockCategory, params?: Record<string, string>) => void;
  removeBlock: (id: string) => void;
  clearWorkspace: () => void;
  updateBlockParam: (id: string, paramName: string, value: string) => void;
  
  engineRef: React.MutableRefObject<ISimulatorEngine | null>;
  executeProgram: () => Promise<void>;
  isRunning: boolean;
  stopExecution: () => void;
  
  energy: number;
  score: number;
  missions: Mission[];
  currentMissionIndex: number;
  consumeEnergy: (amount: number) => void;
  completeMission: () => void;
  
  logs: LogEntry[];
  addLog: (msg: string, type?: 'info' | 'warn' | 'error' | 'success') => void;
}

const SimuladorContext = createContext<SimuladorContextType | undefined>(undefined);

export const SimuladorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [installedHardware, setInstalledHardware] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const [energy, setEnergy] = useState(100);
  const [score, setScore] = useState(0);
  const [missions, setMissions] = useState<Mission[]>([
    { id: 'm1', title: 'Ensamblaje', objective: 'Equipa la Tracción Oruga para encender los motores.', isCompleted: false, maxBlocks: 0 },
    { id: 'm2', title: 'Navegación', objective: 'Llega a la zona de extracción usando [MOVER_RUEDAS].', isCompleted: false, maxBlocks: 2 },
    { id: 'm3', title: 'Despeje', objective: 'Equipa la Garra. Avanza, usa [AGARRAR] en la roca y apártala.', isCompleted: false, maxBlocks: 4 },
    { id: 'm4', title: 'Evasión', objective: 'Equipa el Radar. Evade muros ciegamente usando [SI_DISTANCIA].', isCompleted: false, maxBlocks: 5 },
    { id: 'm5', title: 'Rescate', objective: 'Equipa Hélices. Usa [ELEVARSE] para sortear el cráter.', isCompleted: false, maxBlocks: 3 },
  ]);
  const [currentMissionIndex, setCurrentMissionIndex] = useState(0);

  const engineRef = useRef<ISimulatorEngine | null>(null);
  const blockIdCounter = useRef(0);
  const stopRequested = useRef(false);

  const consumeEnergy = (amount: number) => {
    setEnergy(prev => Math.max(0, prev - amount));
  };

  const completeMission = () => {
    setMissions(prev => {
      const next = [...prev];
      next[currentMissionIndex].isCompleted = true;
      return next;
    });
    
    // Calculate score based on blocks used vs maxBlocks
    const mission = missions[currentMissionIndex];
    let points = 1000;
    if (blocks.length <= mission.maxBlocks) points += 500; // Efficiency bonus
    points += energy * 10; // Energy bonus
    
    setScore(prev => prev + points);
    addLog(`¡Misión completada! +${points} pts`, 'success');
    
    if (currentMissionIndex < missions.length - 1) {
      setCurrentMissionIndex(prev => prev + 1);
    }
  };

  const addLog = (msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time: `[${time}]`, msg, type }]);
  };

  const installHardware = (id: string) => {
    if (!installedHardware.includes(id)) {
      setInstalledHardware(prev => [...prev, id]);
      addLog(`Hardware instalado: ${id}`, 'success');
    }
  };

  const uninstallHardware = (id: string) => {
    setInstalledHardware(prev => prev.filter(h => h !== id));
    // Also remove any blocks that depend on it
    if (id === 'ultrasonic') {
      setBlocks(prev => prev.filter(b => b.type !== 'si_distancia' && b.type !== 'leer_distancia'));
    }
    addLog(`Hardware removido: ${id}`, 'warn');
  };

  const addBlock = (type: string, category: BlockCategory, params: Record<string, string> = {}) => {
    const newBlock: Block = {
      id: `block_${blockIdCounter.current++}`,
      type,
      category,
      params
    };
    setBlocks(prev => [...prev, newBlock]);
    addLog(`Bloque añadido: ${type}`, 'info');
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const updateBlockParam = (id: string, paramName: string, value: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, params: { ...b.params, [paramName]: value } } : b));
  };

  const clearWorkspace = () => {
    setBlocks([]);
    if (engineRef.current) {
      engineRef.current.reset();
    }
    addLog('Workspace limpiado', 'info');
  };

  const stopExecution = () => {
    stopRequested.current = true;
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setIsRunning(false);
    addLog('Ejecución detenida por el usuario', 'error');
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const executeProgram = async () => {
    if (blocks.length === 0) {
      addLog('No hay bloques para ejecutar', 'warn');
      return;
    }
    
    setIsRunning(true);
    stopRequested.current = false;
    addLog('Iniciando programa...', 'success');

    if (engineRef.current) {
      engineRef.current.reset();
    }

    try {
      for (const block of blocks) {
        if (stopRequested.current) break;
        if (energy <= 0) {
          addLog('Batería agotada. Abortando misión.', 'error');
          break;
        }
        
        // Highlight block could be done via state, but we'll keep it simple
        
        if (block.type === 'mover_ruedas') {
          const dist = parseFloat(block.params.distancia || '30');
          addLog(`Avanzando ${dist} unidades...`);
          consumeEnergy(dist * 0.2); // Energy cost
          if (engineRef.current) {
             await engineRef.current.moveForward(dist, 1000); // 1 sec duration
          }
        } 
        else if (block.type === 'rotar_nucleo') {
          const angle = parseFloat(block.params.grados || '90');
          addLog(`Rotando ${angle} grados...`);
          consumeEnergy(Math.abs(angle) * 0.1);
          if (engineRef.current) {
             await engineRef.current.rotateCore(angle, 1000);
          }
        }
        else if (block.type === 'si_distancia') {
           addLog('Escaneando entorno...');
           consumeEnergy(2); // Sensor cost
           if (engineRef.current) {
             const dist = await engineRef.current.triggerUltrasonicSensor(1500);
             addLog(`Distancia detectada: ${dist}cm`, 'info');
             if (dist < 10) {
               addLog('¡Obstáculo detectado a menos de 10cm! Evadiendo...', 'warn');
               await engineRef.current.rotateCore(90, 800);
             } else {
               addLog('Camino despejado.', 'success');
             }
           }
        }
        else if (block.type === 'al_iniciar_sistema') {
           addLog('Sistema inicializado correctamente', 'success');
           consumeEnergy(1);
           await delay(500);
        }
        else if (block.type === 'al_detectar_obstaculo') {
           addLog('Sensor reactivo armado.', 'info');
           consumeEnergy(1);
           await delay(500);
        }
        
        await delay(300); // Small pause between blocks
      }
      
      if (!stopRequested.current && energy > 0) {
        addLog('Programa finalizado.', 'success');
        // Example validation for completion - for now, any execution without errors is a win if energy > 0
        // We can simulate checking the mission objective.
      }
    } catch (e: any) {
      addLog(`Error en ejecución: ${e.message}`, 'error');
    } finally {
      setIsRunning(false);
      stopRequested.current = false;
    }
  };

  return (
    <SimuladorContext.Provider value={{
      installedHardware, installHardware, uninstallHardware,
      blocks, addBlock, removeBlock, clearWorkspace, updateBlockParam,
      engineRef, executeProgram, isRunning, stopExecution,
      logs, addLog,
      energy, score, missions, currentMissionIndex, consumeEnergy, completeMission
    }}>
      {children}
    </SimuladorContext.Provider>
  );
};

export const useSimulador = () => {
  const context = useContext(SimuladorContext);
  if (context === undefined) {
    throw new Error('useSimulador must be used within a SimuladorProvider');
  }
  return context;
};
