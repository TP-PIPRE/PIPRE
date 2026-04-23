export interface User {
  id: string;
  email: string;
  role: "admin" | "docente" | "student"; // Asegúrate de que "docente" esté incluido
}
