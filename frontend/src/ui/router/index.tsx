import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "../components/common/Navbar";
import { PaginaInicio } from "../pages/PaginaInicio";
import { Simulador } from "../pages/Simulador";
import { LoginPage } from "../pages/LoginPage";
import { DocenteDashboard } from "../pages/DocenteDashboard";
import { DocenteMetricasPage } from "../pages/DocenteMetricasPage";
import { DocenteRetosPage } from "../pages/DocenteRetosPage";
import { DocenteEstudiantesPage } from "../pages/DocenteEstudiantesPage";
import { CursosPage } from "../pages/CursosPage";
import { ResultadosPage } from "../pages/ResultadosPage";
import { RankingPage } from "../pages/RankingPage";
import { useAuthStore } from "../../infrastructure/store/authStore";

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Layout base que incluye la Navbar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen pt-14 flex flex-col bg-bg text-text">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};

// Componente para restringir acceso a docentes
const DocenteRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (user?.role !== "docente") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const AppRouter = () => {
  return (
    <Routes>
      {/* Ruta pública para el Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas para estudiantes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PaginaInicio />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cursos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CursosPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/simulador"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Simulador />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resultados"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ResultadosPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ranking"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RankingPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas para docentes */}
      <Route
        path="/docente/*"
        element={
          <ProtectedRoute>
            <DocenteRoute>
              <AppLayout>
                <Routes>
                  <Route path="dashboard" element={<DocenteDashboard />} />
                  <Route path="metricas" element={<DocenteMetricasPage />} />
                  <Route path="retos" element={<DocenteRetosPage />} />
                  <Route path="estudiantes" element={<DocenteEstudiantesPage />} />
                </Routes>
              </AppLayout>
            </DocenteRoute>
          </ProtectedRoute>
        }
      />

      {/* Redirigir a /login si la ruta no existe */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
