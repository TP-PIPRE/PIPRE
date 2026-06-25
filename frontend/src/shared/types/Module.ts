import type { Challenge } from "./Challenge";
export interface Module {
  id: string;
  title: string;
  idCourse: string;
  challenges: Challenge[];
}
