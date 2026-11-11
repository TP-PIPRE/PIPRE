import React, {lazy,Suspense,useLayoutEffect} from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Navbar } from "../components/common/Navbar";
import { updateHintVisitRoute } from "../../infrastructure/store/hintVisit";
const PaginaInicio=lazy(()=>import("../pages/PaginaInicio").then(module=>({default:module.PaginaInicio})));
const Simulador=lazy(()=>import("../pages/Simulador").then(module=>({default:module.Simulador})));
const LoginPage=lazy(()=>import("../pages/LoginPage").then(module=>({default:module.LoginPage})));
const DocenteDashboard=lazy(()=>import("../pages/DocenteDashboard").then(module=>({default:module.DocenteDashboard})));
const DocenteMetricasPage=lazy(()=>import("../pages/DocenteMetricasPage").then(module=>({default:module.DocenteMetricasPage})));
const DocenteRetosPage=lazy(()=>import("../pages/DocenteRetosPage").then(module=>({default:module.DocenteRetosPage})));
const DocenteEstudiantesPage=lazy(()=>import("../pages/DocenteEstudiantesPage").then(module=>({default:module.DocenteEstudiantesPage})));
const ResultadosPage=lazy(()=>import("../pages/ResultadosPage").then(module=>({default:module.ResultadosPage})));
const RankingPage=lazy(()=>import("../pages/RankingPage").then(module=>({default:module.RankingPage})));
const PerfilPage=lazy(()=>import("../pages/PerfilPage").then(module=>({default:module.PerfilPage})));
import { getAuthState } from "../../infrastructure/store/authStore";
import { AchievementNotification } from "../components/common/AchievementNotification";

const AdministracionPage=lazy(()=>import("../pages/AdministracionPage").then(module=>({default:module.AdministracionPage})));

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = getAuthState();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Layout base que incluye la Navbar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <Navbar />
      <div id="contenido" tabIndex={-1} className="app-main flex-1 flex flex-col"><AchievementNotification />{children}</div>
    </div>
  );
};

// Componente para restringir acceso a docentes
const DocenteRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = getAuthState();
  if (!user || !["docente", "admin"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const AppRouter = () => {
  const { pathname, search } = useLocation();
  useLayoutEffect(() => updateHintVisitRoute(pathname + search), [pathname, search]);

  return (
    <Suspense fallback={<main className="lab-shell"><p role="status">Cargando página…</p></main>}><Routes>
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
        path="/simulador/:courseId?"
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
        path="/perfil"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PerfilPage />
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
                  <Route path="administracion" element={getAuthState().user?.role==="admin"?<AdministracionPage/>:<Navigate to="/docente/dashboard" replace/>}/>
                  <Route path="dashboard" element={<DocenteDashboard />} />
                  <Route path="metricas" element={<DocenteMetricasPage />} />
                  <Route path="retos" element={<DocenteRetosPage />} />
                  <Route
                    path="estudiantes"
                    element={<DocenteEstudiantesPage />}
                  />
                  <Route path="*" element={<Navigate to="/docente/dashboard" replace />} />
                </Routes>
              </AppLayout>
            </DocenteRoute>
          </ProtectedRoute>
        }
      />

      {/* Redirigir a /login si la ruta no existe */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes></Suspense>
  );
};
