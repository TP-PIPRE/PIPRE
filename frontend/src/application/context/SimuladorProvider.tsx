/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { Block, BlockCategory, EnvironmentType, StudentResult } from "../../shared/types/Simulador";
import type { ISimulatorEngine } from "../../infrastructure/ports/ISimulatorEngine";
import { useThemeStore } from "../../infrastructure/store/themeStore";
import { SimuladorUseCase, type ChallengeData } from "../usecases/SimuladorUseCase";
import { ENVIRONMENT_CONFIGS } from "../../shared/constants/environmentConfigs";
import { getAuthState } from "../../infrastructure/store/authStore";
import type { SimulationResultType } from "../../shared/types/SpecContracts";
import { useRobotSimulations } from "../hooks/useRobotSimulations";
import type { ActivityResponse } from "../../shared/types/SpecContracts";

interface LogEntry {
  time: string;
  msg: string;
  type: "info" | "warn" | "error" | "success";
}

export interface Mission {
  id: string;
  title: string;
  objective: string;
  isCompleted: boolean;
  maxBlocks: number;
}

interface SimuladorContextType {
  environment: EnvironmentType;
  setEnvironment: (env: EnvironmentType) => void;
  isFreeMode: boolean;

  courseId: string | null;
  challengeId: string | null;
  challengeData: ChallengeData | null;
  challenges: ChallengeData[];
  loadChallengeFromCourse: (courseId: string) => Promise<void>;
  selectChallenge: (challenge: ChallengeData) => void;
  setFreeMode: () => void;

  selectedGroupId: string | null;
  setSelectedGroupId: (id: string) => void;
  selectedActivity: ActivityResponse | null;
  setSelectedActivity: (a: ActivityResponse | null) => void;

  portAssignments: Record<string, string>;
  assignHardware: (slotId: string, hardwareId: string) => void;
  clearPort: (slotId: string) => void;
  installedHardware: string[];

  allowedBlocks: Block[];
  allowedHardware: string[];

  blocks: Block[];
  addBlock: (
    type: string,
    category: BlockCategory,
    params?: Record<string, string>,
  ) => void;
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

  challengeCompleted: boolean;
  lastScore: number;
  completeChallenge: () => void;
  dismissChallengeCompletion: () => void;

  logs: LogEntry[];
  addLog: (msg: string, type?: "info" | "warn" | "error" | "success") => void;
  currentTheme: Record<string, any>;

  submitRobotSimulation: () => Promise<void>;
  simulationLoading: boolean;
  simulationError: string | null;
  lastSimulationResult: SimulationResultType | null;
}

const SimuladorContext = createContext<SimuladorContextType | undefined>(
  undefined,
);

export const SimuladorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [environment, setEnvironmentState] = useState<EnvironmentType>("obstacle");
  const [isFreeMode, setIsFreeMode] = useState(true);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);

  const [portAssignments, setPortAssignments] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("pipre_port_assignments");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const { currentTheme } = useThemeStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const [energy, setEnergy] = useState(100);
  const [score, setScore] = useState(0);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentMissionIndex, setCurrentMissionIndex] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [lastScore, setLastScore] = useState(0);

  const engineRef = useRef<ISimulatorEngine | null>(null);
  const blockIdCounter = useRef(0);
  const stopRequested = useRef(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityResponse | null>(null);
  const [lastSimulationResult, setLastSimulationResult] = useState<SimulationResultType | null>(null);
  const startTimeRef = useRef<number>(0);

  const {
    submitSimulation,
    loading: simulationLoading,
    error: simulationError,
  } = useRobotSimulations();

  const simuladorUseCase = useRef(new SimuladorUseCase());

  useEffect(() => {
    localStorage.setItem("pipre_port_assignments", JSON.stringify(portAssignments));
  }, [portAssignments]);

  const getDefaultMissions = (env: EnvironmentType): Mission[] => {
    const config = ENVIRONMENT_CONFIGS[env];
    if (!config) return [];
    return config.missions.map((m) => ({
      id: m.id,
      title: m.title,
      objective: m.objective,
      isCompleted: false,
      maxBlocks: m.maxBlocks,
    }));
  };

  const autoAssignDefaults = (env: EnvironmentType): Record<string, string> => {
    const config = ENVIRONMENT_CONFIGS[env];
    if (!config?.defaultHardware) return {};
    const assignments: Record<string, string> = {};
    for (const hwId of config.defaultHardware) {
      const slot = config.portSlots.find((s) => s.accepts.includes(hwId) && !assignments[s.id]);
      if (slot) assignments[slot.id] = hwId;
    }
    return assignments;
  };

  const setEnvironment = (env: EnvironmentType) => {
    setEnvironmentState(env);
    setPortAssignments(autoAssignDefaults(env));
    setBlocks([]);
    setEnergy(100);
    setScore(0);
    setCurrentMissionIndex(0);
    setMissions(getDefaultMissions(env));

    addLog(`Entorno cambiado a: ${ENVIRONMENT_CONFIGS[env]?.name || env}`, "info");
  };

  const setFreeMode = () => {
    setIsFreeMode(true);
    setCourseId(null);
    setChallengeId(null);
    setChallengeData(null);
    setEnvironment(environment);
  };

  const loadChallengeFromCourse = async (cId: string) => {
    const courseChallenges = await simuladorUseCase.current.loadChallengesByCourse(cId);
    setChallenges(courseChallenges);
    setCourseId(cId);
    setIsFreeMode(false);

    if (courseChallenges.length > 0) {
      selectChallenge(courseChallenges[0]);
    } else {
      addLog("No hay retos disponibles para este curso.", "warn");
      setFreeMode();
    }
  };

  const selectChallenge = (challenge: ChallengeData) => {
    setChallengeId(challenge.id);
    setChallengeData(challenge);

    if (challenge.environment) {
      setEnvironmentState(challenge.environment);
    }

    const challengeMissions: Mission[] = challenge.missions.map((m) => ({
      id: m.id,
      title: m.title,
      objective: m.objective,
      isCompleted: false,
      maxBlocks: m.maxBlocks || challenge.maxBlocks,
    }));

    setMissions(challengeMissions);
    setCurrentMissionIndex(0);
    setPortAssignments(autoAssignDefaults(challenge.environment));
    setBlocks([]);
    setEnergy(100);
    setScore(0);

    addLog(`Reto cargado: ${challenge.title}`, "success");
  };

  const getFilteredBlocks = (): Block[] => {
    const config = ENVIRONMENT_CONFIGS[environment];
    if (!config) return [];
    return config.blocks.map((bd) => ({
      id: `def_${bd.type}`,
      type: bd.type,
      category: bd.category,
      params: bd.params || {},
    }));
  };

  const getFilteredHardware = (): string[] => {
    const config = ENVIRONMENT_CONFIGS[environment];
    if (!config) return [];
    return config.hardware.map((h) => h.id);
  };

  const allowedBlocks = getFilteredBlocks();
  const allowedHardware = getFilteredHardware();
  const installedHardware = Object.values(portAssignments).filter(Boolean);

  const consumeEnergy = (amount: number) => {
    setEnergy((prev) => Math.max(0, prev - amount));
  };

  const completeMission = () => {
    const mission = missions[currentMissionIndex];
    if (!mission) return;

    /* BACKEND: Enviar resultado al API
     * if (courseId && challengeId) {
     *   simuladorUseCase.current.submitResult(
     *     getAuthState().user?.id || "",
     *     challengeId,
     *     result.score,
     *     { completed: result.completed, blocks: blocks.length, energy }
     *   );
     * }
     */

    let points = 1000;
    if (blocks.length <= mission.maxBlocks) points += 500;
    points += energy * 10;

    setMissions((prev) => {
      const next = [...prev];
      next[currentMissionIndex].isCompleted = true;
      return next;
    });

    setScore((prev) => prev + points);
    addLog(`¡Misión completada! +${points} pts`, "success");

    // Si hay más misiones, avanzar; si no, completar el reto automáticamente
    if (currentMissionIndex < missions.length - 1) {
      setCurrentMissionIndex((prev) => prev + 1);
    } else if (!isFreeMode && challengeData) {
      // Todas las misiones completadas → completar el reto
      setTimeout(() => {
        const authUser = getAuthState().user;
        const total = score + points;
        const result: StudentResult = {
          studentId: authUser?.id || courseId || "unknown",
          studentName: authUser?.name || "Estudiante Demo",
          courseId: courseId || "unknown",
          courseName: challengeData?.idCourse === "1" ? "Robótica Nivel 1" : challengeData?.idCourse === "2" ? "Programación de Microcontroladores" : "",
          challengeId: challengeId || "unknown",
          challengeTitle: challengeData?.title || "Reto sin título",
          environment,
          score: total,
          blocks: blocks.length,
          energy: Math.round(energy),
          completedAt: new Date().toISOString(),
        };
        simuladorUseCase.current.saveResult(result).catch(console.warn);
        setLastScore(total);
        setChallengeCompleted(true);
        addLog(`¡Reto completado! Puntaje: ${total} pts`, "success");
      }, 500);
    }
  };

  const completeChallenge = () => {
    const authUser = getAuthState().user;
    const totalScore = score;

    const result: StudentResult = {
      studentId: authUser?.id || courseId || "unknown",
      studentName: authUser?.name || "Estudiante Demo",
      courseId: courseId || "unknown",
      courseName: challengeData?.idCourse === "1" ? "Robótica Nivel 1" : challengeData?.idCourse === "2" ? "Programación de Microcontroladores" : "",
      challengeId: challengeId || "unknown",
      challengeTitle: challengeData?.title || "Reto sin título",
      environment,
      score: totalScore,
      blocks: blocks.length,
      energy: Math.round(energy),
      completedAt: new Date().toISOString(),
    };

    simuladorUseCase.current.saveResult(result).catch(console.warn);
    setLastScore(totalScore);
    setChallengeCompleted(true);
    addLog(`¡Reto completado! Puntaje: ${totalScore} pts`, "success");
  };

  const addLog = (
    msg: string,
    type: "info" | "warn" | "error" | "success" = "info",
  ) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time: `[${time}]`, msg, type }]);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!selectedActivity) return;
    setIsFreeMode(true);
    if (selectedActivity.environment) {
      setEnvironmentState(selectedActivity.environment);
    }
    const activityMissions: Mission[] = (selectedActivity.missions || []).map((m) => ({
      id: m.id,
      title: m.title,
      objective: m.objective,
      isCompleted: false,
      maxBlocks: m.maxBlocks,
    }));
    setMissions(activityMissions);
    setCurrentMissionIndex(0);
    setPortAssignments(autoAssignDefaults(selectedActivity.environment));
    setBlocks([]);
    setEnergy(100);
    setScore(0);
    addLog(`Actividad cargada: ${selectedActivity.name}`, "success");
  }, [selectedActivity]);

  const submitRobotSimulation = useCallback(async () => {
    const authUser = getAuthState().user;
    const userId = authUser?.id || (import.meta.env.DEV ? "dev-mock-user" : null);
    if (!userId) {
      addLog("No hay usuario autenticado para registrar simulación", "error");
      return;
    }
    if (!selectedActivity && !challengeId) {
      addLog("No hay actividad o reto seleccionado", "warn");
      return;
    }

    const blocklyCode = blocks.map((b) => `${b.type}(${JSON.stringify(b.params)})`).join("\n");
    const result: SimulationResultType = score >= missions.filter((m) => m.isCompleted).length * 1000 ? "SUCCESS" : score > 0 ? "PARTIAL" : "FAILURE";

    const startPos = selectedActivity?.startingPosition ?? { x: 0, z: 0 };
    const targetPos = selectedActivity?.targetPosition ?? { x: 30, z: 0 };

    const sim = await submitSimulation({
      idStudent: userId,
      idActivity: selectedActivity?.id ?? challengeId ?? "",
      blocklyCode,
      pseudocode: "",
      pseintDiagram: "",
      blocksUsage: blocks.length,
      codeUsage: blocks.filter((b) => (b.category as string) === "logic" || (b.category as string) === "control").length,
      sensorError: Math.random() * 0.3,
      resolutionTime: Date.now() - (startTimeRef.current || Date.now()),
      environment,
      missions: missions.map((m) => ({
        id: m.id,
        title: m.title,
        objective: m.objective,
        isCompleted: m.isCompleted,
        maxBlocks: m.maxBlocks,
      })),
      startingPosition: startPos,
      targetPosition: targetPos,
      result,
    });

    if (sim) {
      setLastSimulationResult(result);
      addLog(`Simulación registrada: ${result}`, "success");
    }
  }, [submitSimulation, selectedActivity, challengeId, blocks, missions, environment, score, addLog, setLastSimulationResult]);

  const dismissChallengeCompletion = () => {
    setChallengeCompleted(false);
  };

  const assignHardware = (slotId: string, hardwareId: string) => {
    /* BACKEND: persistir asignación slot→hardware
     * await apiService.simulador.assignHardware(userId, environment, slotId, hardwareId);
     */
    setPortAssignments((prev) => ({ ...prev, [slotId]: hardwareId }));
    addLog(`Hardware instalado: ${hardwareId}`, "success");
  };

  const clearPort = (slotId: string) => {
    const config = ENVIRONMENT_CONFIGS[environment];
    const prevHw = portAssignments[slotId];
    const blockTypes = config?.hardware.find((h) => h.id === prevHw)?.unlocks || [];
    setPortAssignments((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    if (blockTypes.length > 0) {
      setBlocks((prev) =>
        prev.filter((b) => !blockTypes.includes(b.type)),
      );
    }
    addLog(`Hardware removido: ${prevHw || slotId}`, "warn");
  };

  const addBlock = (
    type: string,
    category: BlockCategory,
    params: Record<string, string> = {},
  ) => {
    const newBlock: Block = {
      id: `block_${blockIdCounter.current++}`,
      type,
      category,
      params,
    };
    setBlocks((prev) => [...prev, newBlock]);
    addLog(`Bloque añadido: ${type}`, "info");
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBlockParam = (id: string, paramName: string, value: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, params: { ...b.params, [paramName]: value } } : b,
      ),
    );
  };

  const clearWorkspace = () => {
    setBlocks([]);
    if (engineRef.current) {
      engineRef.current.reset();
    }
    addLog("Workspace limpiado", "info");
  };

  const stopExecution = () => {
    stopRequested.current = true;
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setIsRunning(false);
    addLog("Ejecución detenida por el usuario", "error");
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const executeProgram = async () => {
    if (blocks.length === 0) {
      addLog("No hay bloques para ejecutar", "warn");
      return;
    }

    setIsRunning(true);
    stopRequested.current = false;
    startTimeRef.current = Date.now();
    addLog("Iniciando programa...", "success");

    if (engineRef.current) {
      engineRef.current.reset();
    }

    try {
      for (const block of blocks) {
        if (stopRequested.current) break;
        if (energy <= 0) {
          addLog("Batería agotada. Abortando misión.", "error");
          break;
        }

        switch (block.type) {
          case "al_iniciar_sistema":
            addLog("Sistema inicializado correctamente", "success");
            consumeEnergy(1);
            await delay(500);
            break;

          case "al_detectar_obstaculo":
            addLog("Sensor reactivo armado.", "info");
            consumeEnergy(1);
            await delay(500);
            break;

          case "mover_ruedas":
          case "avanzar":
          case "desplazarse": {
            const dist = parseFloat(block.params.distancia || "30");
            addLog(`Avanzando ${dist} unidades...`);
            consumeEnergy(dist * 0.2);
            if (engineRef.current) {
              await engineRef.current.moveForward(dist, 1000);
            }
            break;
          }

          case "rotar_nucleo":
          case "girar": {
            const angle = parseFloat(block.params.grados || "90");
            addLog(`Rotando ${angle} grados...`);
            consumeEnergy(Math.abs(angle) * 0.1);
            if (engineRef.current) {
              await engineRef.current.rotateCore(angle, 1000);
            }
            break;
          }

          case "retroceder": {
            const backDist = parseFloat(block.params.distancia || "30");
            addLog(`Retrocediendo ${backDist} unidades...`);
            consumeEnergy(backDist * 0.2);
            if (engineRef.current) {
              await engineRef.current.rotateCore(180, 500);
              await engineRef.current.moveForward(backDist, 1000);
              await engineRef.current.rotateCore(-180, 500);
            }
            break;
          }

          case "atacar":
            addLog("¡ATACANDO!");
            consumeEnergy(10);
            if (engineRef.current && "attack" in engineRef.current) {
              await (engineRef.current as any).attack(parseFloat(block.params.potencia || "50"), 800);
            } else {
              await delay(800);
            }
            break;

          case "defender":
            addLog("Escudo activado.");
            consumeEnergy(5);
            if (engineRef.current && "activateShield" in engineRef.current) {
              await (engineRef.current as any).activateShield(1000);
            } else {
              await delay(500);
            }
            break;

          case "escanear_enemigo":
            addLog("Escaneando enemigos cercanos...");
            consumeEnergy(3);
            if (engineRef.current && "scan" in engineRef.current) {
              const result = await (engineRef.current as any).scan(1500);
              addLog(`Enemigos detectados: ${result}`, "info");
            } else {
              await delay(1000);
            }
            break;

          case "golpear":
            addLog("¡GOLPEANDO con el hacha!");
            consumeEnergy(8);
            if (engineRef.current && "strike" in engineRef.current) {
              await (engineRef.current as any).strike(800);
            } else {
              await delay(600);
            }
            break;

          case "despegar":
          case "elevarse": {
            const altura = parseFloat(block.params.altura || "50");
            addLog(`Despegando a altura ${altura}...`);
            consumeEnergy(15);
            if (engineRef.current && "takeOff" in engineRef.current) {
              await (engineRef.current as any).takeOff(altura, 1200);
            } else {
              await delay(800);
            }
            break;
          }

          case "aterrizar":
            addLog("Aterrizando...");
            consumeEnergy(10);
            if (engineRef.current && "land" in engineRef.current) {
              await (engineRef.current as any).land(1000);
            } else {
              await delay(800);
            }
            break;

          case "recolectar":
            addLog("Recolectando muestra...");
            consumeEnergy(5);
            if (engineRef.current && "collect" in engineRef.current) {
              await (engineRef.current as any).collect(1000);
            } else {
              await delay(800);
            }
            break;

          case "analizar":
            addLog("Analizando terreno...");
            consumeEnergy(3);
            if (engineRef.current && "analyze" in engineRef.current) {
              const data = await (engineRef.current as any).analyze(1500);
              addLog(`Composición del suelo: ${data}`, "info");
            } else {
              await delay(1000);
            }
            break;

          case "perforar":
            addLog("Perforando roca...");
            consumeEnergy(10);
            if (engineRef.current && "drill" in engineRef.current) {
              await (engineRef.current as any).drill(1000);
            } else {
              await delay(800);
            }
            break;

          case "iluminar":
            addLog("¡Faro encendido!");
            consumeEnergy(3);
            if (engineRef.current && "lightUp" in engineRef.current) {
              await (engineRef.current as any).lightUp(1200);
            } else {
              await delay(600);
            }
            break;

          case "abrir_puerta":
            addLog("Intentando abrir puerta...");
            consumeEnergy(4);
            if (engineRef.current && "openDoor" in engineRef.current) {
              const opened = await (engineRef.current as any).openDoor(1000);
              addLog(opened ? "Puerta abierta." : "No hay puerta cerca.", opened ? "success" : "warn");
            } else {
              await delay(600);
            }
            break;

          case "detectar_magia":
            addLog("Escaneando rastros mágicos...");
            consumeEnergy(3);
            if (engineRef.current && "detectMagic" in engineRef.current) {
              const magic = await (engineRef.current as any).detectMagic(1200);
              addLog(`Rastros de magia: ${magic}`, "info");
            } else {
              await delay(800);
            }
            break;

          case "teletransportar":
            addLog("¡Teletransportándose!");
            consumeEnergy(20);
            if (engineRef.current && "teleport" in engineRef.current) {
              await (engineRef.current as any).teleport(1500);
            } else {
              await delay(1000);
            }
            break;

          case "congelar":
            addLog("¡CONGELANDO el entorno!");
            consumeEnergy(7);
            if (engineRef.current && "freeze" in engineRef.current) {
              await (engineRef.current as any).freeze(1200);
            } else {
              await delay(800);
            }
            break;

          case "acelerar": {
            const speed = parseFloat(block.params.velocidad || "50");
            addLog(`Acelerando a velocidad ${speed}...`);
            consumeEnergy(8);
            if (engineRef.current && "boost" in engineRef.current) {
              await (engineRef.current as any).boost(speed, 800);
            } else {
              await delay(500);
            }
            break;
          }

          case "frenar":
            addLog("Frenando...");
            consumeEnergy(2);
            if (engineRef.current && "brake" in engineRef.current) {
              await (engineRef.current as any).brake(500);
            } else {
              await delay(400);
            }
            break;

          case "saltar":
            addLog("¡Saltando!");
            consumeEnergy(6);
            if (engineRef.current && "jump" in engineRef.current) {
              await (engineRef.current as any).jump(800);
            } else {
              await delay(600);
            }
            break;

          case "esquivar":
            addLog("Esquivando obstáculo...");
            consumeEnergy(5);
            if (engineRef.current && "dodge" in engineRef.current) {
              await (engineRef.current as any).dodge(600);
            } else {
              if (engineRef.current) {
                await engineRef.current.rotateCore(45, 300);
                await engineRef.current.moveForward(15, 400);
                await engineRef.current.rotateCore(-45, 300);
              }
            }
            break;

          case "frenado_emergencia":
            addLog("¡FRENADO DE EMERGENCIA!");
            consumeEnergy(12);
            if (engineRef.current && "emergencyBrake" in engineRef.current) {
              await (engineRef.current as any).emergencyBrake(600);
            } else {
              await delay(400);
            }
            break;

          case "si_distancia":
            addLog("Escaneando entorno...");
            consumeEnergy(2);
            if (engineRef.current) {
              const dist = await engineRef.current.triggerUltrasonicSensor(1500);
              addLog(`Distancia detectada: ${dist}cm`, "info");
              if (dist < 10) {
                addLog("¡Obstáculo detectado! Evadiendo...", "warn");
                await engineRef.current.rotateCore(90, 800);
              } else {
                addLog("Camino despejado.", "success");
              }
            }
            break;

          default:
            addLog(`Bloque desconocido: ${block.type}`, "warn");
            await delay(300);
        }

        await delay(300);
      }

      if (!stopRequested.current && energy > 0) {
        addLog("Programa finalizado.", "success");
        // Auto-completar misión actual si hay misión activa
        const currentMission = missions[currentMissionIndex];
        if (currentMission && !currentMission.isCompleted && !isFreeMode) {
          completeMission();
        }
      }
    } catch (e: any) {
      addLog(`Error en ejecución: ${e.message}`, "error");
    } finally {
      setIsRunning(false);
      stopRequested.current = false;
    }
  };

  return (
    <SimuladorContext.Provider
      value={{
        environment,
        setEnvironment,
        isFreeMode,

        courseId,
        challengeId,
        challengeData,
        challenges,
        loadChallengeFromCourse,
        selectChallenge,
        setFreeMode,

        portAssignments,
        assignHardware,
        clearPort,
        installedHardware,

        allowedBlocks,
        allowedHardware,

        blocks,
        addBlock,
        removeBlock,
        clearWorkspace,
        updateBlockParam,

        selectedGroupId,
        setSelectedGroupId,
        selectedActivity,
        setSelectedActivity,

        engineRef,
        executeProgram,
        isRunning,
        stopExecution,

        logs,
        addLog,
        energy,
        score,
        missions,
        currentMissionIndex,
        consumeEnergy,
        completeMission,
        challengeCompleted,
        lastScore,
        completeChallenge,
        dismissChallengeCompletion,
        currentTheme,

        submitRobotSimulation,
        simulationLoading,
        simulationError,
        lastSimulationResult,
      }}
    >
      {children}
    </SimuladorContext.Provider>
  );
};

export const useSimulador = () => {
  const context = useContext(SimuladorContext);
  if (context === undefined) {
    throw new Error("useSimulador must be used within a SimuladorProvider");
  }
  return context;
};
