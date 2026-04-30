export interface Metrica {
  id: string;
  titulo: string;
  valor: string | number;
  variacion: string;
  icono: string;
}

export interface Reto {
  id: string;
  nombre: string;
  categoria: string;
  dificultad: number;
  estado: boolean;
}

export interface EstudianteDestacado {
  id: string;
  nombre: string;
  xp: number;
  variacionXP: number;
  posicion: number;
  avatar: string;
}

export interface DashboardDocenteData {
  metricas: Metrica[];
  retos: Reto[];
  estudiantesDestacados: EstudianteDestacado[];
}
