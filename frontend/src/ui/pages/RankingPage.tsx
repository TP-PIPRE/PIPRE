import React from 'react';

const MOCK_RANKING = [
  { id: '1', name: 'Ana Sofía Lopez', group: 'Robótica A', xp: 12500, avatar: 'A', rank: 1, trend: 'up' },
  { id: '2', name: 'Carlos Ruiz', group: 'Mecatrónica B', xp: 11800, avatar: 'C', rank: 2, trend: 'same' },
  { id: '3', name: 'Elena García', group: 'Robótica A', xp: 11250, avatar: 'E', rank: 3, trend: 'down' },
  { id: '4', name: 'Marcos Soto', group: 'Sistemas I', xp: 10900, avatar: 'M', rank: 4, trend: 'up' },
  { id: '5', name: 'Lucía Méndez', group: 'Robótica A', xp: 10450, avatar: 'L', rank: 5, trend: 'up' },
];

export const RankingPage: React.FC = () => {
  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <header className="mb-12 text-center">
        <h1 className="text-2xl font-mono font-bold tracking-[0.1em] mb-3 uppercase">Comunidad & Ranking</h1>
        <p className="text-text-muted text-sm font-medium max-w-xl mx-auto">
          Compite con otros grupos y escala en el ranking global del Sector Alfa.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Top 3 Visuals */}
        <div className="order-2 md:order-1 pt-8">
          <div className="border border-border bg-surface/30 p-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-surface flex items-center justify-center border border-border font-bold text-text mb-4">2</div>
            <p className="font-bold text-sm text-text mb-1">Carlos Ruiz</p>
            <p className="text-[10px] text-text-muted font-mono mb-4">Mecatrónica B</p>
            <span className="text-xs font-mono font-bold text-primary">11,800 XP</span>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="border-2 border-primary bg-primary/5 p-8 text-center flex flex-col items-center relative transform scale-105 shadow-[0_0_30px_rgba(var(--primary),0.1)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-bg px-3 py-1 font-mono font-bold text-[10px] tracking-widest uppercase">Líder</div>
            <div className="w-16 h-16 bg-primary flex items-center justify-center border border-primary font-black text-bg text-xl mb-4">1</div>
            <p className="font-bold text-lg text-text mb-1">Ana Sofía Lopez</p>
            <p className="text-[10px] text-text-muted font-mono mb-4 uppercase tracking-widest">Robótica A</p>
            <span className="text-sm font-mono font-bold text-primary">12,500 XP</span>
          </div>
        </div>
        <div className="order-3 pt-12">
          <div className="border border-border bg-surface/30 p-6 text-center flex flex-col items-center">
            <div className="w-10 h-10 bg-surface flex items-center justify-center border border-border font-bold text-text mb-4">3</div>
            <p className="font-bold text-sm text-text mb-1">Elena García</p>
            <p className="text-[10px] text-text-muted font-mono mb-4">Robótica A</p>
            <span className="text-xs font-mono font-bold text-primary">11,250 XP</span>
          </div>
        </div>
      </div>

      <div className="border border-border bg-surface/40">
        <div className="p-4 border-b border-border bg-surface/60 flex justify-between items-center">
          <h2 className="text-[10px] font-mono font-bold text-text uppercase tracking-widest">Top 50 Estudiantes</h2>
          <div className="flex gap-4 text-[9px] font-mono uppercase tracking-widest">
            <button className="text-primary border-b border-primary">Global</button>
            <button className="text-text-muted hover:text-text">Mi Grupo</button>
          </div>
        </div>
        <div className="divide-y divide-border/50">
          {MOCK_RANKING.map(user => (
            <div key={user.id} className="flex items-center p-4 hover:bg-surface/30 transition-colors">
              <div className="w-10 font-mono font-bold text-text-muted text-center text-xs">{user.rank}</div>
              <div className="w-10 h-10 bg-bg border border-border flex items-center justify-center font-bold text-text mr-4 text-xs">
                {user.avatar}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-text">{user.name}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-widest">{user.group}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono font-bold text-primary">{user.xp.toLocaleString()} XP</p>
                <span className={`material-symbols-outlined text-sm ${user.trend === 'up' ? 'text-green-500' : user.trend === 'down' ? 'text-red-500' : 'text-text-muted opacity-30'}`}>
                  {user.trend === 'up' ? 'trending_up' : user.trend === 'down' ? 'trending_down' : 'horizontal_rule'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-bg/40 text-center">
          <button className="text-[10px] font-mono font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-[0.2em]">Ver lista completa</button>
        </div>
      </div>
    </main>
  );
};

export default RankingPage;
