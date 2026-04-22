import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Header } from "./ui/components/common/Header";
import { HeaderDocente } from "./ui/components/common/HeaderDocente";
import { PaginaInicio } from "./ui/pages/PaginaInicio";
import { Simulador } from "./ui/pages/Simulador";
import { LoginPage } from "./ui/pages/LoginPage";
import { DocenteDashboard } from "./ui/pages/DocenteDashboard";
import { useAuthStore } from "./infrastructure/store/authStore";

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente que envuelve las rutas que deben mostrar el Header
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};

// Componente que envuelve las rutas de docentes que deben mostrar el HeaderDocente
const DocenteLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <HeaderDocente />
      {children}
    </>
  );
};

// Componente para redirigir a docentes
const DocenteRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();

  if (user?.role !== "docente") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta para el Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas para estudiantes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PaginaInicio />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulador"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Simulador />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Rutas protegidas para docentes */}
        <Route
          path="/docente/*"
          element={
            <ProtectedRoute>
              <DocenteRoute>
                <DocenteLayout>
                  <Routes>
                    <Route path="dashboard" element={<DocenteDashboard />} />
                  </Routes>
                </DocenteLayout>
              </DocenteRoute>
            </ProtectedRoute>
          }
        />

        {/* Redirigir a /login si la ruta no existe */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
