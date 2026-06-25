import type { Challenge } from "./Challenge";
export interface Course {
  id: string;
  nombre: string;
  descripcion: string;
  imagen?: string;
  tipo: "curso" | "simulador";
  challenges: Challenge[]; // Lista de retos asociados al curso
}
