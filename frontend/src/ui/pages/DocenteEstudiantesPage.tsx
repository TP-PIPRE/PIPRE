import React, { useState } from "react";
import { Modal } from "../components/common/Modal";

const MOCK_GROUPS = [
  { id: "g1", name: "Robótica A", students: 24, requests: 2, avgProgress: 78 },
  {
    id: "g2",
    name: "Mecatrónica B",
    students: 18,
    requests: 0,
    avgProgress: 64,
  },
  { id: "g3", name: "Sistemas I", students: 30, requests: 5, avgProgress: 42 },
];

const MOCK_HELP_REQUESTS = [
  {
    id: "r1",
    student: "Mateo Rivera",
    group: "Sistemas I",
    topic: "Cinemática Inversa",
    date: "Hace 10 min",
    message: "Profesor, tengo dudas sobre cómo calcular la matriz Jacobiana para el brazo de 3 grados de libertad. ¿Podría revisar mi código?"
  },
  {
    id: "r2",
    student: "Sofía Chen",
    group: "Robótica A",
    topic: "Conexión de Actuadores",
    date: "Hace 1 hora",
    message: "El simulador no me reconoce el sensor ultrasónico en el puerto digital 4. Ya verifiqué los bloques de inicialización."
  },
];

export const DocenteEstudiantesPage: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState("");

  return (
    <main
      className="flex-1 p-8 max-w-7xl mx-auto w-full animate-fade-in-soft"
    >
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Gestión de <span className="text-primary/80">Estudiantes</span>
        </h1>
        <p className="text-xs text-text-muted/60 max-w-md font-medium">
          Control de grupos académicos y atención prioritaria de solicitudes de soporte técnico.
        </p>
      </header>

      {/* CHAT MODAL — uses shared component */}
      <Modal 
        isOpen={selectedRequest !== null} 
        onClose={() => setSelectedRequest(null)}
        maxWidth="max-w-2xl"
        height="600px"
      >
        {selectedRequest && (
          <div className="flex flex-col h-full">
            {/* Modal Header — Hero Style */}
            <div className="relative h-28 bg-primary/10 overflow-hidden flex items-center px-10 border-b border-border/10">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--theme-primary) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
              </div>
              <div className="relative flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-surface shadow-lg flex items-center justify-center border border-border/20 rotate-3 group-hover:rotate-0 transition-all duration-500">
                  <span className="material-symbols-outlined text-primary text-2xl">forum</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-1 block">Canal de Soporte Técnico</span>
                  <h2 className="text-xl font-bold tracking-tight">{selectedRequest.student}</h2>
                  <p className="text-[10px] font-medium text-text-muted/60">
                    {selectedRequest.topic} • {selectedRequest.group}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              {/* Student Message */}
              <div className="flex flex-col items-start gap-2 max-w-[80%]">
                <div className="bg-surface border border-border/30 p-4 text-sm leading-relaxed" style={{ borderRadius: "var(--theme-radius)" }}>
                  {selectedRequest.message}
                </div>
                <span className="text-[9px] font-mono text-text-muted/40 ml-2">{selectedRequest.date}</span>
              </div>

              {/* Instructor Response Placeholder */}
              <div className="flex flex-col items-end gap-2 ml-auto max-w-[80%] opacity-40 italic">
                <div className="bg-primary/5 border border-primary/10 p-4 text-sm leading-relaxed" style={{ borderRadius: "var(--theme-radius)" }}>
                  Esperando respuesta del instructor...
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-8 border-t border-border/10 bg-surface/30">
              <form 
                onSubmit={(e) => { e.preventDefault(); setSelectedRequest(null); }}
                className="flex gap-4"
              >
                <input 
                  autoFocus
                  placeholder="Escribe una instrucción técnica o respuesta..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-bg/50 border border-border/30 px-6 py-5 text-sm focus:border-primary outline-none transition-all placeholder:opacity-30"
                  style={{ borderRadius: "var(--theme-radius)" }}
                />
                <button 
                  type="submit"
                  className="btn-premium px-10 py-5 text-[10px] font-black tracking-widest"
                >
                  ENVIAR
                </button>
              </form>
            </div>
          </div>
        )}
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Groups Column */}
        <div className="lg:col-span-8 space-y-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40 mb-6">
            Nodos de Grupo Asignados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_GROUPS.map((group) => (
              <div
                key={group.id}
                className="group bg-surface/30 border border-border/10 p-8 flex flex-col justify-between transition-all duration-700 hover:border-primary/20 hover:-translate-y-1 hover:shadow-xl"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-[10px] font-mono text-text-muted/40 uppercase tracking-widest">
                      {group.students} Estudiantes • Activo
                    </p>
                  </div>
                  {group.requests > 0 && (
                    <span 
                      className="bg-danger text-white text-[9px] font-black px-3 py-1.5 animate-pulse-slow"
                      style={{ borderRadius: "var(--theme-radius)" }}
                    >
                      {group.requests} ALERTAS
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-text-muted/60">
                    <span>Progreso del Nodo</span>
                    <span className="text-primary">{group.avgProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-bg border border-border/10 overflow-hidden" style={{ borderRadius: "var(--theme-radius)" }}>
                    <div
                      className="h-full bg-primary transition-all duration-1000"
                      style={{ width: `${group.avgProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Requests Column */}
        <div className="lg:col-span-4 space-y-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40 mb-6">
            Solicitudes de Soporte
          </h2>
          <div className="space-y-4">
            {MOCK_HELP_REQUESTS.map((req) => (
              <div
                key={req.id}
                className="bg-surface/30 border border-border/10 p-6 relative group transition-all duration-500 hover:border-primary/20 hover:bg-surface/50"
                style={{ borderRadius: "var(--theme-radius)" }}
              >
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button 
                    onClick={() => setSelectedRequest(req)}
                    className="w-10 h-10 flex items-center justify-center bg-primary text-bg shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                    style={{ borderRadius: "var(--theme-radius)" }}
                  >
                    <span className="material-symbols-outlined text-lg">forum</span>
                  </button>
                </div>
                <p className="text-xs font-bold mb-1">{req.student}</p>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">
                  {req.topic}
                </p>
                <div className="flex justify-between items-center text-[9px] font-mono text-text-muted/40 uppercase tracking-[0.2em] pt-4 border-t border-border/5">
                  <span>{req.group}</span>
                  <span>{req.date}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-4 border border-dashed border-border/20 text-text-muted/40 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all text-[10px] font-black uppercase tracking-[0.3em]" style={{ borderRadius: "var(--theme-radius)" }}>
            HISTORIAL DE SOPORTE
          </button>
        </div>
      </div>
    </main>
  );
};

