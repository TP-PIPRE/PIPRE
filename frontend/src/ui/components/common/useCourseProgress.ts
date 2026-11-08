import { useEffect, useState } from "react";
import { gameProgressService } from "../../../infrastructure/api/gameProgressService";
import { getApiErrorMessage } from "../../../infrastructure/api/errors";
import type { LevelProgressDTO } from "../../../infrastructure/api/models/gameProgressModels";
import { useAchievementStore } from "../../../infrastructure/store/achievementStore";

export function useCourseProgress(studentId?: string) {
  const revision = useAchievementStore(state => studentId ? state.revisions[studentId] ?? 0 : 0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    studentId: string; revision: number; attempt: number; levels?: LevelProgressDTO[]; error?: string;
  }>();

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    gameProgressService.progress(studentId).then(({ levels }) => {
      if (active) setResult({ studentId, revision, attempt, levels });
    }).catch(error => {
      if (active) setResult(previous => ({
        studentId, revision, attempt,
        levels: previous?.studentId === studentId ? previous.levels : undefined,
        error: getApiErrorMessage(error, "No se pudo consultar tu progreso."),
      }));
    });
    return () => { active = false; };
  }, [studentId, revision, attempt]);

  const current = result?.studentId === studentId ? result : undefined;
  const pending = Boolean(studentId) && (current?.revision !== revision || current?.attempt !== attempt);
  return { levels: current?.levels, pending, error: pending ? undefined : current?.error, reload: () => setAttempt(value => value + 1) };
}
