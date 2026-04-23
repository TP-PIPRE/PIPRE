import React from 'react';

const MOCK_COURSES = [
  {
    id: '1',
    title: 'Robótica Industrial I',
    desc: 'Fundamentos de cinemática y programación de brazos robóticos.',
    progress: 65,
    modules: [
      { id: 'm1', name: 'Introducción a Actuadores', lessons: 4, completed: 4 },
      { id: 'm2', name: 'Cinemática Inversa', lessons: 6, completed: 2 },
      { id: 'm3', name: 'Sistemas de Control', lessons: 5, completed: 0 },
    ]
  },
  {
    id: '2',
    title: 'Visión Artificial',
    desc: 'Procesamiento de imágenes y detección de objetos en tiempo real.',
    progress: 20,
    modules: [
      { id: 'm4', name: 'Filtros Espaciales', lessons: 3, completed: 3 },
      { id: 'm5', name: 'Redes Neuronales', lessons: 8, completed: 0 },
    ]
  }
];

export const CursosPage: React.FC = () => {
  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h1 className="text-xl font-mono font-bold tracking-tight mb-2">Mis Cursos</h1>
        <p className="text-text-muted text-sm font-medium">Explora tus módulos, lecciones y actividades de simulación.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {MOCK_COURSES.map(course => (
          <div key={course.id} className="border border-border bg-surface/40 overflow-hidden group">
            <div className="p-6 border-b border-border bg-surface/60">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-mono font-bold text-text group-hover:text-primary transition-colors">
                  {course.title}
                </h2>
                <span className="font-mono text-xs text-primary">{course.progress}%</span>
              </div>
              <p className="text-text-muted text-xs mb-6 line-clamp-2">{course.desc}</p>
              
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-bg border border-border overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${course.progress}%` }} 
                />
              </div>
            </div>

            <div className="p-6 space-y-4 bg-bg/20">
              <h3 className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest mb-4">Módulos del Curso</h3>
              {course.modules.map(module => (
                <div key={module.id} className="flex items-center justify-between p-3 border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 ${module.completed === module.lessons ? 'bg-primary' : 'bg-border'}`} />
                    <div>
                      <p className="text-xs font-semibold text-text">{module.name}</p>
                      <p className="text-[10px] text-text-muted">{module.completed} de {module.lessons} lecciones completadas</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-muted text-lg">chevron_right</span>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-border flex justify-end">
              <button className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest hover:underline">
                Continuar Aprendizaje
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default CursosPage;
