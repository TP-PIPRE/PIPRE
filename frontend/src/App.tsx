import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Header } from "./ui/components/Header";
import { PaginaInicio } from "./ui/pages/PaginaInicio";
import { Simulador } from "./ui/pages/Simulador";
import { LoginPage } from "./ui/pages/LoginPage";
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

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta para el Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas */}
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

        {/* Redirigir a /login si la ruta no existe o no está autenticado */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
