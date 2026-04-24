import React from "react";

const MOCK_RANKING = [
  {
    id: "1",
    name: "Ana Sofía Lopez",
    group: "Robótica A",
    xp: 12500,
    avatar: "A",
    rank: 1,
    trend: "up",
  },
  {
    id: "2",
    name: "Carlos Ruiz",
    group: "Mecatrónica B",
    xp: 11800,
    avatar: "C",
    rank: 2,
    trend: "same",
  },
  {
    id: "3",
    name: "Elena García",
    group: "Robótica A",
    xp: 11250,
    avatar: "E",
    rank: 3,
    trend: "down",
  },
  {
    id: "4",
    name: "Marcos Soto",
    group: "Sistemas I",
    xp: 10900,
    avatar: "M",
    rank: 4,
    trend: "up",
  },
  {
    id: "5",
    name: "Lucía Méndez",
    group: "Robótica A",
    xp: 10450,
    avatar: "L",
    rank: 5,
    trend: "up",
  },
];

export const RankingPage: React.FC = () => {
  return (
    <main
      className="flex-1 p-6 max-w-5xl mx-auto w-full"
      style={{
        backgroundColor: "var(--theme-bg)",
        color: "var(--theme-text)",
      }}
    >
      {/* Header */}
      <header className="mb-12 text-center">
        <h1
          className="text-2xl font-mono font-bold tracking-[0.1em] mb-3 uppercase"
          style={{ color: "var(--theme-text)" }}
        >
          Comunidad & Ranking
        </h1>
        <p
          className="text-sm font-medium max-w-xl mx-auto"
          style={{ color: "var(--theme-text-muted)" }}
        >
          Compite con otros grupos y escala en el ranking global del Sector
          Alfa.
        </p>
      </header>

      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Segundo lugar */}
        <div className="order-2 md:order-1 pt-8">
          <div
            className="border border-border p-6 text-center flex flex-col items-center"
            style={{
              backgroundColor: "rgba(var(--theme-surface-rgb), 0.3)",
            }}
          >
            <div
              className="w-12 h-12 flex items-center justify-center border border-border font-bold mb-4"
              style={{
                backgroundColor: "var(--theme-surface)",
                color: "var(--theme-text)",
              }}
            >
              2
            </div>
            <p
              className="font-bold text-sm mb-1"
              style={{ color: "var(--theme-text)" }}
            >
              Carlos Ruiz
            </p>
            <p
              className="text-[10px] font-mono mb-4 uppercase tracking-widest"
              style={{ color: "var(--theme-text-muted)" }}
            >
              Mecatrónica B
            </p>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "var(--theme-primary)" }}
            >
              11,800 XP
            </span>
          </div>
        </div>

        {/* Primer lugar */}
        <div className="order-1 md:order-2">
          <div
            className="border-2 p-8 text-center flex flex-col items-center relative transform scale-105"
            style={{
              borderColor: "var(--theme-primary)",
              backgroundColor: "rgba(var(--theme-primary-rgb), 0.05)",
              boxShadow: "0 0 30px rgba(var(--theme-primary-rgb), 0.1)",
            }}
          >
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 font-mono font-bold text-[10px] tracking-widest uppercase"
              style={{
                backgroundColor: "var(--theme-primary)",
                color: "var(--theme-bg)",
              }}
            >
              Líder
            </div>
            <div
              className="w-16 h-16 flex items-center justify-center border font-black text-xl mb-4"
              style={{
                backgroundColor: "var(--theme-primary)",
                borderColor: "var(--theme-primary)",
                color: "var(--theme-bg)",
              }}
            >
              1
            </div>
            <p
              className="font-bold text-lg mb-1"
              style={{ color: "var(--theme-text)" }}
            >
              Ana Sofía Lopez
            </p>
            <p
              className="text-[10px] font-mono mb-4 uppercase tracking-widest"
              style={{ color: "var(--theme-text-muted)" }}
            >
              Robótica A
            </p>
            <span
              className="text-sm font-mono font-bold"
              style={{ color: "var(--theme-primary)" }}
            >
              12,500 XP
            </span>
          </div>
        </div>

        {/* Tercer lugar */}
        <div className="order-3 pt-12">
          <div
            className="border border-border p-6 text-center flex flex-col items-center"
            style={{
              backgroundColor: "rgba(var(--theme-surface-rgb), 0.3)",
            }}
          >
            <div
              className="w-10 h-10 flex items-center justify-center border border-border font-bold mb-4"
              style={{
                backgroundColor: "var(--theme-surface)",
                color: "var(--theme-text)",
              }}
            >
              3
            </div>
            <p
              className="font-bold text-sm mb-1"
              style={{ color: "var(--theme-text)" }}
            >
              Elena García
            </p>
            <p
              className="text-[10px] font-mono mb-4"
              style={{ color: "var(--theme-text-muted)" }}
            >
              Robótica A
            </p>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "var(--theme-primary)" }}
            >
              11,250 XP
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de ranking */}
      <div
        className="border border-border"
        style={{
          backgroundColor: "rgba(var(--theme-surface-rgb), 0.4)",
        }}
      >
        {/* Header de la tabla */}
        <div
          className="p-4 border-b border-border flex justify-between items-center"
          style={{
            backgroundColor: "rgba(var(--theme-surface-rgb), 0.6)",
          }}
        >
          <h2
            className="text-[10px] font-mono font-bold uppercase tracking-widest"
            style={{ color: "var(--theme-text)" }}
          >
            Top 50 Estudiantes
          </h2>
          <div className="flex gap-4 text-[9px] font-mono uppercase tracking-widest">
            <button
              className="border-b"
              style={{
                color: "var(--theme-primary)",
                borderColor: "var(--theme-primary)",
              }}
            >
              Global
            </button>
            <button
              className="hover:text-text"
              style={{ color: "var(--theme-text-muted)" }}
            >
              Mi Grupo
            </button>
          </div>
        </div>

        {/* Lista de ranking */}
        <div className="divide-y">
          {MOCK_RANKING.map((user) => (
            <div
              key={user.id}
              className="flex items-center p-4 hover:bg-surface/30 transition-colors"
              style={{
                borderColor: "rgba(var(--theme-border-rgb), 0.5)",
                backgroundColor: "rgba(var(--theme-bg-rgb), 0.1)",
              }}
            >
              <div
                className="w-10 font-mono font-bold text-center text-xs"
                style={{ color: "var(--theme-text-muted)" }}
              >
                {user.rank}
              </div>
              <div
                className="w-10 h-10 border flex items-center justify-center font-bold text-xs mr-4"
                style={{
                  backgroundColor: "var(--theme-bg)",
                  borderColor: "var(--theme-border)",
                  color: "var(--theme-text)",
                }}
              >
                {user.avatar}
              </div>
              <div className="flex-1">
                <p
                  className="text-xs font-bold"
                  style={{ color: "var(--theme-text)" }}
                >
                  {user.name}
                </p>
                <p
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: "var(--theme-text-muted)" }}
                >
                  {user.group}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-xs font-mono font-bold"
                  style={{ color: "var(--theme-primary)" }}
                >
                  {user.xp.toLocaleString()} XP
                </p>
                <span
                  className={`material-symbols-outlined text-sm ${
                    user.trend === "up"
                      ? "text-green-500"
                      : user.trend === "down"
                        ? "text-red-500"
                        : "opacity-30"
                  }`}
                  style={{
                    color:
                      user.trend === "same" ? "var(--theme-text-muted)" : "",
                  }}
                >
                  {user.trend === "up"
                    ? "trending_up"
                    : user.trend === "down"
                      ? "trending_down"
                      : "horizontal_rule"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Botón de ver más */}
        <div
          className="p-4 text-center"
          style={{ backgroundColor: "rgba(var(--theme-bg-rgb), 0.4)" }}
        >
          <button
            className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:underline transition-colors"
            style={{ color: "var(--theme-text-muted)" }}
          >
            Ver lista completa
          </button>
        </div>
      </div>
    </main>
  );
};

export default RankingPage;
