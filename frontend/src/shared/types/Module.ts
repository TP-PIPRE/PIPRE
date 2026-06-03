import type { Challenge } from "./Challenge";
export interface Module {
  id: string;
  title: string;
  id_course: string;
  challenges: Challenge[];
}
