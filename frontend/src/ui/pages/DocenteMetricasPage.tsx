import React from 'react';

const MOCK_METRICS = {
  dropoutRisk: [
    { id: '1', name: 'Marcos Soto', risk: 'Alto', trend: 'up', reason: 'Baja actividad en simulador' },
    { id: '2', name: 'Elena García', risk: 'Medio', trend: 'down', reason: 'Retraso en módulo 3' },
    { id: '3', name: 'Sofía Chen', risk: 'Bajo', trend: 'same', reason: 'Progreso constante' },
  ],
  moduleEfficiency: [
    { name: 'Intro a Robótica', completion: 94, avgScore: 88 },
    { name: 'Cinemática', completion: 72, avgScore: 75 },
    { name: 'Sensores', completion: 85, avgScore: 82 },
  ]
};

export const DocenteMetricasPage: React.FC = () => {
  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h1 className="text-xl font-mono font-bold tracking-tight mb-2">Métricas y Análisis</h1>
        <p className="text-text-muted text-sm font-medium">Seguimiento de riesgo de deserción y eficiencia de módulos académicos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Dropout Risk Panel */}
        <div className="border border-border bg-surface/40 p-6">
          <h2 className="text-xs font-mono font-bold text-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-red-500">warning</span>
            Alerta de Deserción (Dropout Risk)
          </h2>
          <div className="space-y-4">
            {MOCK_METRICS.dropoutRisk.map(student => (
              <div key={student.id} className="flex items-center justify-between p-4 border border-border/50 bg-bg/20">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text">{student.name}</span>
                  <span className="text-[10px] text-text-muted">{student.reason}</span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-mono font-bold uppercase ${student.risk === 'Alto' ? 'text-red-500' : student.risk === 'Medio' ? 'text-yellow-500' : 'text-primary'}`}>
                      RIESGO {student.risk}
                    </span>
                    <span className="text-[9px] text-text-muted font-mono">{student.trend === 'up' ? 'Aumentando' : 'Estable'}</span>
                  </div>
                  <button className="text-text-muted hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">mail</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module Efficiency */}
        <div className="border border-border bg-surface/40 p-6">
          <h2 className="text-xs font-mono font-bold text-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">analytics</span>
            Eficiencia por Módulo
          </h2>
          <div className="space-y-6">
            {MOCK_METRICS.moduleEfficiency.map(mod => (
              <div key={mod.name}>
                <div className="flex justify-between text-[10px] font-mono text-text-muted mb-2 uppercase tracking-widest">
                  <span>{mod.name}</span>
                  <span>{mod.completion}% Finalización</span>
                </div>
                <div className="h-1.5 w-full bg-bg border border-border overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${mod.completion}%` }} />
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-[9px] font-mono text-primary">Promedio: {mod.avgScore} pts</span>
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
