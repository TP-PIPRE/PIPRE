import React from 'react';

const MOCK_COURSES = [
  { id: '1', title: 'Robótica Industrial I', modules: 12, activities: 24, status: 'Activo' },
  { id: '2', title: 'Visión Artificial Avanzada', modules: 8, activities: 15, status: 'Borrador' },
  { id: '3', title: 'Sistemas Embebidos', modules: 10, activities: 20, status: 'Activo' },
];

export const DocenteRetosPage: React.FC = () => {
  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-mono font-bold tracking-tight mb-2">Gestión de Retos y Cursos</h1>
          <p className="text-text-muted text-sm font-medium">Administra la estructura curricular: Cursos, Módulos y Actividades de Simulación.</p>
        </div>
        <button className="bg-primary text-bg px-5 py-2.5 font-mono font-bold uppercase text-[10px] tracking-widest hover:opacity-90 transition-opacity">
          Crear Nuevo Curso
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {MOCK_COURSES.map(course => (
          <div key={course.id} className="border border-border bg-surface/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-bg border border-border flex items-center justify-center">
                <span className="material-symbols-outlined text-text-muted">account_tree</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-text mb-1">{course.title}</h2>
                <div className="flex gap-4 text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  <span>{course.modules} Módulos</span>
                  <span>{course.activities} Actividades</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 border ${course.status === 'Activo' ? 'border-primary/30 text-primary bg-primary/5' : 'border-border text-text-muted'}`}>
                  {course.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 border border-border hover:border-primary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button className="p-2 border border-border hover:border-red-500 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-10 border border-dashed border-border flex flex-col items-center justify-center text-center bg-bg/20">
        <span className="material-symbols-outlined text-4xl text-text-muted/20 mb-4">add_circle</span>
        <h3 className="text-xs font-mono font-bold text-text-muted uppercase tracking-widest mb-2">Editor de Actividades</h3>
        <p className="text-[11px] text-text-muted/60 max-w-xs">
          Crea simulaciones personalizadas vinculando bloques de código a comportamientos robóticos.
        </p>
      </div>
    </main>
  );
};

export default DocenteRetosPage;
