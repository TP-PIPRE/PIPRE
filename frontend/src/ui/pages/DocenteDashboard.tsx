import { useDashboardDocente } from "../../application/hooks/useDashboardDocente";

const mockDashboardData = {
  metricas: [
    { id: "1", titulo: "Retos Activos", valor: 12, variacion: "+2", icono: "school" },
    { id: "2", titulo: "Estudiantes", valor: 120, variacion: "+15", icono: "group" },
    { id: "3", titulo: "Progreso Global", valor: "78%", variacion: "↑", icono: "trending_up" },
  ],
  retos: [
    { id: "1", nombre: "Chatbot Educativo", categoria: "ML", dificultad: 2, estado: true },
    { id: "2", nombre: "Brazo Robótico v2", categoria: "Robótica", dificultad: 3, estado: true },
    { id: "3", nombre: "Debate: Ética IA", categoria: "Ética", dificultad: 1, estado: false },
  ],
  estudiantesDestacados: [
    { id: "1", nombre: "Lucía Mendez", xp: 4850, variacionXP: 120, posicion: 1, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRXeHbyvhi3GcZupKkP-LGXR5VJwrpv15E8-xqt06PA4kbxyXqK4if7SL-JxJtLbihRkOrKlgjgn2_ox3nQg586qQwbIP5--gZsNVoxgYk-8bKRE-L_ypdX7BSCjI4BuyCm4AQ30vHIY6AW1DWu7hMX6-V7FwEJmUpjHb8ucX0Tt7AVbQCFZ3qt90Y5hT_E2Aojucql0TGkuPDepB1dR4BBJOKPDRHcJbkvqvWiYbfyYa6z25eVczbwUiv3dP2aQdanuG1VAps7oc" },
    { id: "2", nombre: "Mateo Rivera", xp: 4120, variacionXP: 85, posicion: 2, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAndtY1yIqKoZ2MnPG2v3YOFYwMW4S0pjFXhqYr1rikeNifUDF2ednsL9Gyo-gsAxIy7ZkQS1sD_dqMN1OJIr-kuJUI9tuKCoS-1G36IkWa4Z4ebV9v-Ug7x9lO08bv49ntV56oXPel-mdJCk899yLztUMCo5NSHwxFJrJ-VfsqCyKXeJwWjaYdw26vMxTtFsgOrpWwGMwsKCw7Ti5DJSlrozyoL6ybXxlUeqrGJmW0YdgR63w1T36ZbsbpqBwDjROHxFgzEXW4McA" },
    { id: "3", nombre: "Sofía Chen", xp: 3980, variacionXP: 40, posicion: 3, avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKi3ucl5uNxoQnuEy7SMW7vUggGVb3yY8rNPL54UB0U0RmqK9GKrO9iqrG3uNq_u4KbyBnS-pUCYYvF5g2pLdkgP3dv4g5vTzyGSy8SR9_ams3O4OlpC69EPxelvqMM3qN3WdqUJBIVw1fd81IfdGnuBFled71wQ582UocGiO3DrSsdzfoLxkKTl3NXuefb4G_hZoZsy36rPFE5qJXFlLyME-eB6QDXHpTKIIXkJjlnMmjaXR1vG8QE6SvjkrJJBs8ld3uAkPy6c0" },
  ],
};

export const DocenteDashboard = () => {
  const { dashboardData, loading, error } = useDashboardDocente();
  const dataToShow = error ? mockDashboardData : dashboardData || mockDashboardData;

  if (loading && !dataToShow) return (
    <div className="flex-1 flex items-center justify-center font-mono text-xs text-text-muted">
      Cargando datos...
    </div>
  );

  return (
    <main className="flex-1 flex flex-col p-6 max-w-[1280px] mx-auto w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-mono font-bold tracking-tight mb-1">
            Panel del Instructor
          </h1>
          <p className="text-text-muted text-sm">
            Gestión de retos, estudiantes y seguimiento de progreso.
          </p>
        </div>
        <button className="bg-primary text-bg px-6 py-3 font-mono font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Nuevo Reto
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {dataToShow.metricas.map((m) => (
          <div key={m.id} className="border border-border bg-surface/50 p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-2xl text-primary">{m.icono}</span>
              <span className="font-mono text-xs text-primary">{m.variacion}</span>
            </div>
            <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-1">{m.titulo}</p>
            <p className="text-3xl font-mono font-bold text-text">{m.valor}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Retos table */}
        <div className="lg:col-span-8 border border-border bg-surface/50 p-6">
          <h2 className="text-sm font-mono font-bold text-text uppercase tracking-wider mb-6">
            Retos Activos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border">
                  <th className="pb-3 font-normal">Nombre</th>
                  <th className="pb-3 font-normal">Categoría</th>
                  <th className="pb-3 font-normal">Nivel</th>
                  <th className="pb-3 font-normal text-center">Estado</th>
                  <th className="pb-3 font-normal text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {dataToShow.retos.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/80 transition-colors">
                    <td className="py-4 font-mono text-xs font-semibold text-text">{r.nombre}</td>
                    <td className="py-4">
                      <span className="text-xs font-mono text-text-muted border border-border px-2 py-0.5">{r.categoria}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={`w-1.5 h-3 ${i <= r.dificultad ? 'bg-primary' : 'bg-border/40'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`text-xs font-mono ${r.estado ? 'text-primary' : 'text-text-muted'}`}>
                        {r.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-text-muted hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button className="text-text-muted hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top students */}
        <div className="lg:col-span-4 border border-border bg-surface/50 p-6">
          <h2 className="text-sm font-mono font-bold text-text uppercase tracking-wider mb-6">
            Mejores Estudiantes
          </h2>
          <div className="space-y-4">
            {dataToShow.estudiantesDestacados.map((e) => (
              <div key={e.id} className="flex items-center gap-4 p-3 border border-border/50">
                <div className="relative shrink-0">
                  <img alt={e.nombre} className="w-10 h-10 object-cover border border-border" src={e.avatar} />
                  <span className="absolute -top-1 -right-1 bg-primary text-bg text-[9px] font-mono font-bold w-4 h-4 flex items-center justify-center">
                    {e.posicion}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text truncate">{e.nombre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-border/30 overflow-hidden">
                      <div className="h-full bg-primary/50" style={{ width: `${(e.xp / 5000) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-text-muted">{e.xp} XP</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-primary">+{e.variacionXP}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border border-dashed border-border text-text-muted hover:text-primary hover:border-primary transition-colors text-xs font-mono uppercase tracking-wider">
            Ver ranking completo
          </button>
        </div>
      </div>
    </main>
  );
};
