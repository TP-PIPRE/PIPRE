import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./ui/components/Header";
import { PaginaInicio } from "./ui/pages/PaginaInicio";
import { Simulador } from "./ui/pages/Simulador";

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
        {/* Rutas que incluyen el Header */}
        <Route
          element={
            <MainLayout>
              <PaginaInicio />
            </MainLayout>
          }
        >
          <Route path="/" element={<PaginaInicio />} />
        </Route>
        <Route
          element={
            <MainLayout>
              <Simulador />
            </MainLayout>
          }
        >
          <Route path="/simulador" element={<Simulador />} />
        </Route>
        {/* Rutas que NO incluyen el Header */}
        {/*<Route path="/login" element={<Login />} />*/}
      </Routes>
    </Router>
  );
};

export default App;
