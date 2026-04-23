export interface Course {
  id: string;
  nombre: string;
  descripcion: string;
  imagen?: string;
  tipo: "curso" | "simulador";
}
