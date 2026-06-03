export interface Challenge {
  id: string;
  id_course: string; // Relación con el curso
  id_module?: string; // Opcional: si el reto pertenece a un módulo específico
  title: string;
  description: string;
  order: number; // Para la secuencialidad (ej: 1, 2, 3...)
  difficulty: "EASY" | "MEDIUM" | "HARD"; // Nivel de dificultad
  points: number; // Puntos para gamificación
  isUnlocked: boolean; // Si el reto está desbloqueado para el estudiante
  simulatorConfig: any; // Configuración específica para el simulador (ej: escenario, objetivos)
  expectedOutput: string; // Resultado esperado (para validación automática)
  reward: {
    type: "BADGE" | "POINTS" | "UNLOCK_NEXT";
    value: string | number; // Ej: "badge_robotics_101" o 50 (puntos)
  };
}
