import React from 'react';

const MOCK_RESULTS = [
  { id: '1', activity: 'Cinemática de Brazo 3DOF', score: 92, date: '2026-04-20', status: 'Excelente', type: 'Simulación' },
  { id: '2', activity: 'Control de Servomotores', score: 85, date: '2026-04-18', status: 'Aprobado', type: 'Teórico' },
  { id: '3', activity: 'Sensores Ultrasónicos', score: 78, date: '2026-04-15', status: 'Aprobado', type: 'Simulación' },
  { id: '4', activity: 'Lógica Difusa Aplicada', score: 98, date: '2026-04-10', status: 'Excelente', type: 'Proyecto' },
];

export const ResultadosPage: React.FC = () => {
  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h1 className="text-xl font-mono font-bold tracking-tight mb-2">Mis Resultados</h1>
        <p className="text-text-muted text-sm font-medium">Seguimiento de desempeño en actividades y simulaciones robóticas.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="border border-border bg-surface/40 p-6 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-2">Promedio General</span>
          <span className="text-3xl font-mono font-bold text-primary">88.2</span>
          <span className="text-[10px] text-primary/60 mt-2 font-mono">↑ 4.5% vs mes anterior</span>
        </div>
        <div className="border border-border bg-surface/40 p-6 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-2">Actividades Completadas</span>
          <span className="text-3xl font-mono font-bold text-text">14</span>
          <span className="text-[10px] text-text-muted/60 mt-2 font-mono">De 20 totales este periodo</span>
        </div>
        <div className="border border-border bg-surface/40 p-6 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-2">Rango Actual</span>
          <span className="text-3xl font-mono font-bold text-text">ORO II</span>
          <span className="text-[10px] text-text-muted/60 mt-2 font-mono">Próximo nivel en 450 XP</span>
        </div>
      </div>

      <div className="border border-border bg-surface/20">
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface/40">
          <h2 className="text-xs font-mono font-bold text-text uppercase tracking-widest">Historial de Actividades</h2>
          <button className="text-[10px] font-mono text-text-muted hover:text-primary transition-colors uppercase tracking-widest">Descargar Reporte</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="text-[10px] text-text-muted uppercase tracking-widest border-b border-border/50">
                <th className="px-6 py-4 font-normal">Actividad</th>
                <th className="px-6 py-4 font-normal">Tipo</th>
                <th className="px-6 py-4 font-normal">Fecha</th>
                <th className="px-6 py-4 font-normal">Calificación</th>
                <th className="px-6 py-4 font-normal text-right">Estatus</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {MOCK_RESULTS.map(res => (
                <tr key={res.id} className="border-b border-border/30 hover:bg-surface/30 transition-colors cursor-pointer">
                  <td className="px-6 py-4 text-text font-semibold">{res.activity}</td>
                  <td className="px-6 py-4 text-text-muted">{res.type}</td>
                  <td className="px-6 py-4 text-text-muted">{res.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-border/30 w-12 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${res.score}%` }} />
                      </div>
                      <span className="text-primary font-bold">{res.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 text-[9px] border ${res.status === 'Excelente' ? 'border-primary/50 text-primary bg-primary/5' : 'border-border text-text-muted'}`}>
                      {res.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default ResultadosPage;
