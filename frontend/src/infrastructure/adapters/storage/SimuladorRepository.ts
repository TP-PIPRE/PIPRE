import { LocalStorageRepository } from "./LocalStorageRepository";
import type { StudentResult } from "../../../shared/types/Simulador";

interface StoredUser {
  id: string;
  password: string;
  name: string;
  role: "student" | "teacher";
}

export class SimuladorRepository extends LocalStorageRepository {
  getPortAssignments(): Record<string, string> {
    return this.get<Record<string, string>>("port_assignments", {});
  }

  savePortAssignments(assignments: Record<string, string>): void {
    this.set("port_assignments", assignments);
  }

  getResults(): StudentResult[] {
    return this.get<StudentResult[]>("results", []);
  }

  saveResult(result: StudentResult): void {
    const results = this.getResults();
    const existingIndex = results.findIndex(
      (r) => r.studentId === result.studentId && r.courseId === result.courseId && r.challengeId === result.challengeId,
    );
    if (existingIndex >= 0) {
      if (result.score > results[existingIndex].score) {
        results[existingIndex] = { ...result, completedAt: new Date().toISOString() };
      }
    } else {
      results.push({ ...result, completedAt: result.completedAt || new Date().toISOString() });
    }
    this.set("results", results);
  }

  getRegisteredUsers(): Record<string, StoredUser> {
    return this.get<Record<string, StoredUser>>("registered_users", {});
  }

  saveRegisteredUsers(users: Record<string, StoredUser>): void {
    this.set("registered_users", users);
  }

  getThemePreference(): string {
    return this.get<string>("theme", "light");
  }

  saveThemePreference(theme: string): void {
    this.set("theme", theme);
  }
}

export const simuladorRepository = new SimuladorRepository();
