import { useDashboardDocente } from "../../application/hooks/useDashboardDocente";

// Datos de prueba
const mockDashboardData = {
  metricas: [
    {
      id: "1",
      titulo: "Retos de IA Activos",
      valor: 12,
      variacion: "+2 este mes",
      icono: "school",
    },
    {
      id: "2",
      titulo: "Total Estudiantes",
      valor: 120,
      variacion: "+15 nuevos",
      icono: "group",
    },
    {
      id: "3",
      titulo: "Progreso Promedio",
      valor: "78%",
      variacion: "",
      icono: "trending_up",
    },
  ],
  retos: [
    {
      id: "1",
      nombre: "Chatbot Educativo",
      categoria: "ML",
      dificultad: 2,
      estado: true,
    },
    {
      id: "2",
      nombre: "Brazo Robótico v2",
      categoria: "Robótica",
      dificultad: 3,
      estado: true,
    },
    {
      id: "3",
      nombre: "Debate: Ética IA",
      categoria: "Ética",
      dificultad: 1,
      estado: false,
    },
  ],
  estudiantesDestacados: [
    {
      id: "1",
      nombre: "Lucía Mendez",
      xp: 4850,
      variacionXP: 120,
      posicion: 1,
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBRXeHbyvhi3GcZupKkP-LGXR5VJwrpv15E8-xqt06PA4kbxyXqK4if7SL-JxJtLbihRkOrKlgjgn2_ox3nQg586qQwbIP5--gZsNVoxgYk-8bKRE-L_ypdX7BSCjI4BuyCm4AQ30vHIY6AW1DWu7hMX6-V7FwEJmUpjHb8ucX0Tt7AVbQCFZ3qt90Y5hT_E2Aojucql0TGkuPDepB1dR4BBJOKPDRHcJbkvqvWiYbfyYa6z25eVczbwUiv3dP2aQdanuG1VAps7oc",
    },
    {
      id: "2",
      nombre: "Mateo Rivera",
      xp: 4120,
      variacionXP: 85,
      posicion: 2,
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAndtY1yIqKoZ2MnPG2v3YOFYwMW4S0pjFXhqYr1rikeNifUDF2ednsL9Gyo-gsAxIy7ZkQS1sD_dqMN1OJIr-kuJUI9tuKCoS-1G36IkWa4Z4ebV9v-Ug7x9lO08bv49ntV56oXPel-mdJCk899yLztUMCo5NSHwxFJrJ-VfsqCyKXeJwWjaYdw26vMxTtFsgOrpWwGMwsKCw7Ti5DJSlrozyoL6ybXxlUeqrGJmW0YdgR63w1T36ZbsbpqBwDjROHxFgzEXW4McA",
    },
    {
      id: "3",
      nombre: "Sofía Chen",
      xp: 3980,
      variacionXP: 40,
      posicion: 3,
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBKi3ucl5uNxoQnuEy7SMW7vUggGVb3yY8rNPL54UB0U0RmqK9GKrO9iqrG3uNq_u4KbyBnS-pUCYYvF5g2pLdkgP3dv4g5vTzyGSy8SR9_ams3O4OlpC69EPxelvqMM3qN3WdqUJBIVw1fd81IfdGnuBFled71wQ582UocGiO3DrSsdzfoLxkKTl3NXuefb4G_hZoZsy36rPFE5qJXFlLyME-eB6QDXHpTKIIXkJjlnMmjaXR1vG8QE6SvjkrJJBs8ld3uAkPy6c0",
    },
  ],
};

export const DocenteDashboard = () => {
  const { dashboardData, loading, error } = useDashboardDocente();

  // Usar datos de prueba si no hay datos reales
  const dataToShow = error
    ? mockDashboardData
    : dashboardData || mockDashboardData;

  if (loading && !dataToShow) return <p>Cargando datos del dashboard...</p>;

  return (
    <main
      className="max-w-[1440px] mx-auto px-8 pt-12 pb-24"
      style={{ backgroundColor: "#f0f8ff" }}
    >
      {/* Dashboard Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">
            Panel de Control RIAs
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl font-body">
            Gestiona los Retos de Inteligencia Artificial para tus alumnos y
            monitorea su progreso educativo en tiempo real.
          </p>
        </div>
        <button className="btn-gradient text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 scale-100 hover:scale-[1.02] active:scale-95 transition-transform">
          <span className="material-symbols-outlined">add_circle</span>
          Nuevo Reto RIA
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {dataToShow.metricas.map((metrica) => (
          <div
            key={metrica.id}
            className={`p-8 rounded-xl relative overflow-hidden group shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_40px_-15px_rgba(0,0,0,0.08)] transition-all
              ${
                metrica.id === "1"
                  ? "bg-[#e3f2fd]"
                  : metrica.id === "2"
                    ? "bg-[#e8f5e8]"
                    : "bg-[#fff3e0]"
              }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-3 rounded-xl ${
                  metrica.id === "1"
                    ? "bg-secondary-container"
                    : metrica.id === "2"
                      ? "bg-primary-container"
                      : "bg-tertiary-container"
                } text-white`}
              >
                <span className="material-symbols-outlined text-3xl">
                  {metrica.icono}
                </span>
              </div>
              <span className="text-tertiary font-bold text-sm bg-tertiary-container/30 px-3 py-1 rounded-full">
                {metrica.variacion}
              </span>
            </div>
            <p className="text-on-surface-variant font-medium mb-1">
              {metrica.titulo}
            </p>
            <p className="text-4xl font-extrabold text-on-surface">
              {metrica.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Tabla de Retos y Estudiantes Destacados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Retos */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#e8f5e8] rounded-xl p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-extrabold text-on-surface">
                Mis Retos de IA
              </h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-surface-container hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">
                    filter_list
                  </span>
                </button>
                <button className="p-2 rounded-lg bg-surface-container hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">
                    sort
                  </span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-on-surface-variant text-sm font-bold uppercase tracking-wider">
                    <th className="px-6 pb-2">Nombre del Reto</th>
                    <th className="px-6 pb-2">Categoría</th>
                    <th className="px-6 pb-2">Dificultad</th>
                    <th className="px-6 pb-2 text-center">Estado</th>
                    <th className="px-6 pb-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dataToShow.retos.map((reto) => (
                    <tr
                      key={reto.id}
                      className="bg-white hover:bg-surface-container-low transition-colors rounded-xl"
                    >
                      <td className="px-6 py-4 rounded-l-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">
                              psychology
                            </span>
                          </div>
                          <span className="font-bold text-on-surface">
                            {reto.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full ${
                            reto.categoria === "ML"
                              ? "bg-secondary-container/50 text-on-secondary-container"
                              : reto.categoria === "Robótica"
                                ? "bg-primary-container/50 text-on-primary-container"
                                : "bg-tertiary-container/50 text-on-tertiary-container"
                          } text-xs font-bold`}
                        >
                          {reto.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {Array.from({ length: 3 }).map((_, index) => (
                            <span
                              key={index}
                              className={`w-2 h-2 rounded-full ${index < reto.dificultad ? "bg-tertiary" : "bg-surface-variant"}`}
                            ></span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={reto.estado}
                              readOnly
                            />
                            <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary"></div>
                          </label>
                        </div>
                      </td>
                      <td className="px-6 py-4 rounded-r-xl text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">
                              edit
                            </span>
                          </button>
                          <button className="p-2 text-on-surface-variant hover:text-error transition-colors">
                            <span className="material-symbols-outlined">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Estudiantes Destacados */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#fff3e0] rounded-xl p-8 relative overflow-hidden h-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-extrabold text-on-surface">
                  Top Students
                </h2>
                <span className="material-symbols-outlined text-secondary">
                  workspace_premium
                </span>
              </div>
              <div className="space-y-6">
                {dataToShow.estudiantesDestacados.map((estudiante) => (
                  <div
                    key={estudiante.id}
                    className="flex items-center gap-4 bg-white p-4 rounded-xl scale-100 hover:scale-[1.03] transition-transform cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        alt={estudiante.nombre}
                        className="w-14 h-14 rounded-full object-cover"
                        src={estudiante.avatar}
                      />
                      <div className="absolute -top-1 -right-1 bg-yellow-400 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full text-white ring-2 ring-white">
                        {estudiante.posicion}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-on-surface">
                        {estudiante.nombre}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {estudiante.xp} XP
                      </p>
                    </div>
                    <div className="text-tertiary font-bold">
                      +{estudiante.variacionXP}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-3 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant hover:bg-white/50 transition-colors font-bold text-sm">
                Ver Ranking Completo
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
