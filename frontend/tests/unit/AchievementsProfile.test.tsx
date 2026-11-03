import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { PerfilPage } from "../../src/ui/pages/PerfilPage";
import { Simulador } from "../../src/ui/pages/Simulador";
import { ResultadosPage } from "../../src/ui/pages/ResultadosPage";
import { AchievementNotification } from "../../src/ui/components/common/AchievementNotification";
import { DailyChallengeCard } from "../../src/ui/components/common/DailyChallengeCard";
import { apiService } from "../../src/infrastructure/api/apiService";
import { gameProgressService } from "../../src/infrastructure/api/gameProgressService";
import { getAuthState } from "../../src/infrastructure/store/authStore";
import { useAchievementStore } from "../../src/infrastructure/store/achievementStore";
import { loadCourseActivities } from "../../src/application/usecases/loadCourseActivities";
import { NEONFLOW_LEVELS } from "../../src/shared/constants/levelConfigs";
import type { AchievementDTO, PlayerProfileDTO } from "../../src/infrastructure/api/models/apiModels";
import type { DailyChallengeDTO, GameProgressDTO, GameVictoryDTO } from "../../src/infrastructure/api/models/gameProgressModels";

vi.mock("../../src/infrastructure/store/authStore", () => ({ getAuthState: vi.fn() }));
vi.mock("../../src/infrastructure/api/apiService", () => ({ apiService: { profile: { get: vi.fn(), getAchievements: vi.fn(), getHistory: vi.fn() }, neonflow: { getTemplate: vi.fn() }, tetrilogic: { getTemplate: vi.fn() } } }));
vi.mock("../../src/infrastructure/api/gameProgressService", () => ({ gameProgressService: { progress: vi.fn(), daily: vi.fn() } }));
vi.mock("../../src/application/usecases/loadCourseActivities", () => ({ loadCourseActivities: vi.fn() }));
vi.mock("../../src/ui/components/common/useValidatedGameSession", () => {
  const session = { enabled: false, state: null, ready: true, verifying: false, action: () => {}, complete: () => {}, retry: () => {}, reset: () => {} };
  return { useValidatedGameSession: () => session };
});

const student = { id: "profile-student", name: "Alumno", email: "student@example.com", role: "student" as const };
const catalog = (): AchievementDTO[] => Array.from({ length: 35 }, (_, i) => {
  const number = i + 1, code = `L${String(number).padStart(2, "0")}`;
  return { idAchievement: code, code, name: `Logro ${code}`, description: `Descripción ${code}`, unlockCondition: `Condición verificable ${code}`, category: number <= 30 ? "progreso" : number === 31 || number === 34 ? "constancia" : number === 33 ? "velocidad" : "maestria", icon: "award", xpReward: 25, hidden: false, active: true, unlocked: number === 1, unlockedAt: number === 1 ? "2026-11-02T02:00:00Z" : null };
});
const profile: PlayerProfileDTO = { idStudent: student.id, studentName: student.name, totalPoints: 0, position: 0, level: 1, xpTotal: 25, totalStars: 2, currentStreak: 0, maxStreak: 0, challengesCompleted: 1, totalBlocksUsed: 0, efficiencyAvg: null };
const progress: GameProgressDTO = { levels: ["neonflow", "tetrilogic"].flatMap(game => Array.from({ length: 30 }, (_, index) => ({ game: game as "neonflow" | "tetrilogic", levelNumber: index + 1, completed: game === "neonflow" && index === 0, bestStars: game === "neonflow" && index === 0 ? 2 : 0 }))), completedLevels: 1, totalLevels: 60, totalStars: 2, currentStreak: 0, bestStreak: 0 };
const daily: DailyChallengeDTO = { id: "2026-11-02", date: "2026-11-02", timeZone: "America/Lima", game: "neonflow", levelNumber: 1, levelTemplate: "neonflow-v2-1", completed: false, currentStreak: 4, bestStreak: 7 };
const victory = (achievements: AchievementDTO[]): GameVictoryDTO => ({ sessionId: "validated-session", game: "neonflow", levelNumber: 1, stars: 2, bestStars: 2, durationMs: 5000, completedAt: "2026-11-02T12:00:00Z", newAchievements: achievements, daily: null });
const openProfile = (tab = "achievements") => render(<MemoryRouter initialEntries={[`/perfil?tab=${tab}`]}><PerfilPage /></MemoryRouter>);
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  vi.mocked(getAuthState).mockReturnValue({ user: student, isAuthenticated: true });
  vi.mocked(apiService.profile.get).mockResolvedValue(profile);
  vi.mocked(apiService.profile.getAchievements).mockResolvedValue(catalog());
  vi.mocked(apiService.profile.getHistory).mockResolvedValue([]);
  vi.mocked(gameProgressService.progress).mockResolvedValue(progress);
  vi.mocked(gameProgressService.daily).mockResolvedValue(daily);
  useAchievementStore.setState({ revisions: {}, notifications: [], seen: {} });
});
afterEach(() => { cleanup(); localStorage.clear(); });

describe("35 confirmed achievements and student profile", () => {
  it("shows all 35 active achievements with readable conditions, categories and Lima unlock dates", async () => {
    vi.mocked(apiService.profile.getAchievements).mockResolvedValue([...catalog(), { ...catalog()[0], idAchievement: "old", code: "OLD_FIRST", name: "Antiguo sin equivalencia", active: false }]);
    openProfile();
    expect(await screen.findByLabelText("1 de 35 logros desbloqueados")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(35);
    for (const category of ["Progreso", "Constancia", "Velocidad", "Maestría"]) expect(screen.getByRole("heading", { name: new RegExp(`^${category}`) })).toBeInTheDocument();
    expect(screen.getByText("Condición verificable L35")).toBeInTheDocument();
    expect(screen.queryByText("Antiguo sin equivalencia")).not.toBeInTheDocument();
    expect(screen.getByText(/Desbloqueado el/)).toHaveTextContent("1 nov");
  });
  it("automatically refreshes server data after a confirmed victory", async () => {
    openProfile(); await screen.findByLabelText("1 de 35 logros desbloqueados");
    const achievements = catalog().map(item => item.code === "L02" ? { ...item, unlocked: true, unlockedAt: "2026-11-02T12:00:00Z" } : item);
    vi.mocked(apiService.profile.getAchievements).mockResolvedValue(achievements);
    act(() => { useAchievementStore.getState().confirmed(student.id, victory([achievements[1]])); });
    expect(await screen.findByLabelText("2 de 35 logros desbloqueados")).toBeInTheDocument();
    expect(apiService.profile.getAchievements).toHaveBeenCalledTimes(2);
  });
  it("uses server history and never displays another account's shared local results", async () => {
    localStorage.setItem("pipre_results", JSON.stringify([{ challengeTitle: "Resultado ajeno", score: 100, stars: 3 }]));
    openProfile("history");
    await screen.findByText(/No hay historial disponible/);
    expect(screen.queryByText("Resultado ajeno")).not.toBeInTheDocument();
  });
  it("shows best stars per level and leaves unknown academic efficiency ungraded", async () => {
    openProfile("stats");
    expect(await screen.findByLabelText("Nivel 1: 2 de 3 estrellas")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Nivel \d+:/)).toHaveLength(60);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(await screen.findByText("Mejor: 7 días")).toBeInTheDocument();
  });
  it("exposes a retry state without inventing achievements when profile loading fails", async () => {
    vi.mocked(apiService.profile.getAchievements).mockRejectedValueOnce(new Error("offline"));
    openProfile();
    await screen.findByRole("alert");
    expect(screen.queryByText("Logro L01")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByLabelText("1 de 35 logros desbloqueados")).toBeInTheDocument();
  });
  it("notifies confirmed unlocks once and hides other students' notifications", () => {
    const achievement = catalog()[0], receipt = victory([achievement]);
    act(() => { useAchievementStore.getState().confirmed(student.id, receipt); useAchievementStore.getState().confirmed(student.id, receipt); });
    const view = render(<MemoryRouter><AchievementNotification /></MemoryRouter>);
    expect(screen.getByRole("status")).toHaveTextContent("Logro desbloqueado: Logro L01");
    expect(useAchievementStore.getState().notifications).toHaveLength(1);
    vi.mocked(getAuthState).mockReturnValue({ user: { ...student, id: "another-student" }, isAuthenticated: true });
    view.rerender(<MemoryRouter><AchievementNotification /></MemoryRouter>);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("keeps ungraded verified victories separate from an academic failure in results", async () => {
    vi.mocked(apiService.profile.getHistory).mockResolvedValue([{idResult:"verified",idActivity:"",activityName:"Partida verificada",score:null,stars:2,xpEarned:0,efficiency:null,dateAttempted:"2026-11-02T12:00:00Z"}]);
    render(<MemoryRouter><ResultadosPage/></MemoryRouter>);
    await screen.findByText("Partida verificada");
    expect(screen.getAllByText("Sin nota académica").length).toBeGreaterThan(0);
    expect(screen.queryByText("Requiere refuerzo")).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("NaN");
  });
  it("hides the previous student's profile immediately when the account changes", async () => {
    const view=openProfile();await screen.findByLabelText("1 de 35 logros desbloqueados");
    let resolve!:(value:PlayerProfileDTO)=>void;
    vi.mocked(apiService.profile.get).mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));
    vi.mocked(getAuthState).mockReturnValue({user:{...student,id:"second-student",name:"Otro alumno"},isAuthenticated:true});
    view.rerender(<MemoryRouter initialEntries={["/perfil?tab=achievements"]}><PerfilPage/></MemoryRouter>);
    expect(screen.queryByLabelText("1 de 35 logros desbloqueados")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando tu perfil");
    resolve({...profile,idStudent:"second-student",studentName:"Otro alumno"});
    await screen.findByText("Otro alumno");
  });
});

describe("Daily challenge entry", () => {
  it("uses the server calendar and streak, then opens the daily route", async () => {
    function Destination() { const location = useLocation(); return <p>Destino {location.pathname}{location.search}</p>; }
    render(<MemoryRouter><Routes><Route path="/" element={<DailyChallengeCard />} /><Route path="/simulador" element={<Destination />} /></Routes></MemoryRouter>);
    await screen.findByText("Mejor: 7 días");
    expect(screen.getByText("2026-11-02")).toBeInTheDocument();
    expect(screen.getByText("Racha: 4 días")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Iniciar reto diario" }));
    expect(screen.getByText("Destino /simulador?daily=true")).toBeInTheDocument();
  });
  it("loads the persisted canonical daily board without inventing an activity or course", async () => {
    vi.mocked(apiService.neonflow.getTemplate).mockResolvedValue({ templateId: NEONFLOW_LEVELS[0].templateId!, version: 2, config: NEONFLOW_LEVELS[0] });
    render(<MemoryRouter initialEntries={["/simulador?daily=true"]}><Routes><Route path="/simulador" element={<Simulador />} /></Routes></MemoryRouter>);
    expect(await screen.findByLabelText("Tablero Neon Flow")).toBeInTheDocument();
    expect(apiService.neonflow.getTemplate).toHaveBeenCalledWith("neonflow-v2-1", expect.any(AbortSignal));
    expect(loadCourseActivities).not.toHaveBeenCalled();
    expect(screen.getByText(/America\/Lima/)).toBeInTheDocument();
  });
  it("refuses an unknown or mismatched daily board instead of silently choosing level one", async () => {
    vi.mocked(gameProgressService.daily).mockResolvedValue({ ...daily, levelTemplate: "neonflow-v2-30" });
    render(<MemoryRouter initialEntries={["/simulador?daily=true"]}><Routes><Route path="/simulador" element={<Simulador />} /></Routes></MemoryRouter>);
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("Tablero Neon Flow")).not.toBeInTheDocument();
    expect(apiService.neonflow.getTemplate).not.toHaveBeenCalled();
  });
  it("refreshes completion and streak only after server-confirmed progress changes", async () => {
    render(<MemoryRouter><DailyChallengeCard /></MemoryRouter>);
    await screen.findByText("Racha: 4 días");
    vi.mocked(gameProgressService.daily).mockResolvedValue({ ...daily, completed: true, currentStreak: 5 });
    act(() => { useAchievementStore.getState().confirmed(student.id, victory([])); });
    await screen.findByText("Completado hoy");
    expect(screen.getByText("Racha: 5 días")).toBeInTheDocument();
    await waitFor(() => expect(gameProgressService.daily).toHaveBeenCalledTimes(2));
  });
  it("ignores another account's late daily response and does not leak its streak", async () => {
    let resolve!:(value:DailyChallengeDTO)=>void;
    vi.mocked(gameProgressService.daily).mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));
    const view=render(<MemoryRouter><DailyChallengeCard/></MemoryRouter>);
    await waitFor(()=>expect(gameProgressService.daily).toHaveBeenCalledTimes(1));
    vi.mocked(gameProgressService.daily).mockResolvedValueOnce({...daily,currentStreak:0,bestStreak:0});
    vi.mocked(getAuthState).mockReturnValue({user:{...student,id:"second-student"},isAuthenticated:true});
    view.rerender(<MemoryRouter><DailyChallengeCard/></MemoryRouter>);
    await screen.findByText("Racha: 0 días");
    await act(async()=>{resolve({...daily,currentStreak:99,bestStreak:99});});
    expect(screen.queryByText("Racha: 99 días")).not.toBeInTheDocument();
    expect(screen.getByText("Racha: 0 días")).toBeInTheDocument();
  });
});
