import React from "react";
import { BsExclamationTriangleFill, BsEnvelope, BsGraphUp } from "react-icons/bs";

const MOCK_METRICS = {
  dropoutRisk: [
    {
      id: "1",
      name: "Marcos Soto",
      risk: "Alto",
      trend: "up",
      reason: "Baja actividad en simulador",
    },
    {
      id: "2",
      name: "Elena García",
      risk: "Medio",
      trend: "down",
      reason: "Retraso en módulo 3",
    },
    {
      id: "3",
      name: "Sofía Chen",
      risk: "Bajo",
      trend: "same",
      reason: "Progreso constante",
    },
  ],
  moduleEfficiency: [
    { name: "Intro a Robótica", completion: 94, avgScore: 88 },
    { name: "Cinemática", completion: 72, avgScore: 75 },
    { name: "Sensores", completion: 85, avgScore: 82 },
  ],
};

export const DocenteMetricasPage: React.FC = () => {
  return (
    <main
      className="flex-1 p-6 max-w-7xl mx-auto w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="mb-10">
        <h1
          className="text-xl font-mono font-bold tracking-tight mb-2 transition-all duration-300 hover:text-primary"
          style={{ color: "var(--text)" }}
        >
          Métricas y Análisis
        </h1>
        <p
          className="text-sm font-medium transition-all duration-300"
          style={{ color: "var(--text-muted)" }}
        >
          Seguimiento de riesgo de deserción y eficiencia de módulos académicos.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Dropout Risk Panel */}
        <div
          className="border border-border p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] rounded-lg"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <h2
            className="text-xs font-mono font-bold uppercase tracking-widest mb-6 flex items-center gap-2 transition-all duration-300"
            style={{ color: "var(--text)" }}
          >
            <BsExclamationTriangleFill
              className="text-sm transition-all duration-300"
              style={{ color: "var(--danger)" }}
            />
            Alerta de Deserción (Dropout Risk)
          </h2>
          <div className="space-y-4">
            {MOCK_METRICS.dropoutRisk.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border border-border/50 transition-all duration-300 hover:bg-surface-brighter rounded-lg"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <div className="flex flex-col">
                  <span
                    className="text-xs font-bold transition-all duration-300"
                    style={{ color: "var(--text)" }}
                  >
                    {student.name}
                  </span>
                  <span
                    className="text-[10px] transition-all duration-300"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {student.reason}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="flex flex-col">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase transition-all duration-300 ${
                        student.risk === "Alto"
                          ? "text-danger"
                          : student.risk === "Medio"
                            ? "text-yellow-500"
                            : "text-primary"
                      }`}
                    >
                      Riesgo {student.risk}
                    </span>
                    <span
                      className="text-[9px] font-mono transition-all duration-300"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {student.trend === "up"
                        ? "Aumentando"
                        : student.trend === "down"
                          ? "Disminuyendo"
                          : "Estable"}
                    </span>
                  </div>
                  <button className="text-text-muted hover:text-primary transition-all duration-300 transform hover:scale-110 rounded-full p-1">
                    <BsEnvelope className="text-base" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module Efficiency */}
        <div
          className="border border-border p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] rounded-lg"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <h2
            className="text-xs font-mono font-bold uppercase tracking-widest mb-6 flex items-center gap-2 transition-all duration-300"
            style={{ color: "var(--text)" }}
          >
            <BsGraphUp
              className="text-sm transition-all duration-300"
              style={{ color: "var(--primary)" }}
            />
            Eficiencia por Módulo
          </h2>
          <div className="space-y-6">
            {MOCK_METRICS.moduleEfficiency.map((mod) => (
              <div
                key={mod.name}
                className="p-4 transition-all duration-300 hover:scale-[1.01] rounded-lg"
                style={{ backgroundColor: "rgba(var(--surface-rgb), 0.5)" }}
              >
                <div
                  className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-2 transition-all duration-300"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>{mod.name}</span>
                  <span>{mod.completion}% Finalización</span>
                </div>
                <div
                  className="h-1.5 w-full border border-border overflow-hidden transition-all duration-500 rounded-full"
                  style={{ backgroundColor: "var(--surface)" }}
                >
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${mod.completion}%`,
                      backgroundColor: "var(--primary)",
                    }}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <span
                    className="text-[9px] font-mono transition-all duration-300 hover:text-yellow-500"
                    style={{ color: "var(--primary)" }}
                  >
                    Promedio: {mod.avgScore} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default DocenteMetricasPage;
