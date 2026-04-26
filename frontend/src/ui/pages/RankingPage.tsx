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
  const [activeTab, setActiveTab] = React.useState("global");

  return (
    <main
      className="flex-1 p-6 max-w-5xl mx-auto w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Header */}
      <header className="mb-12 text-center">
        <h1
          className="text-2xl font-mono font-bold tracking-[0.1em] mb-3 uppercase transition-all duration-300 hover:text-primary"
          style={{ color: "var(--text)" }}
        >
          Comunidad & Ranking
        </h1>
        <p
          className="text-sm font-medium max-w-xl mx-auto transition-all duration-300"
          style={{ color: "var(--text-muted)" }}
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
            className="border border-border p-6 text-center flex flex-col items-center transition-all duration-300 hover:shadow-lg hover:scale-105"
            style={{ backgroundColor: "var(--bg)" }}
          >
            <div
              className="w-12 h-12 flex items-center justify-center border border-border font-bold mb-4 transition-all duration-300"
              style={{
                backgroundColor: "var(--surface)",
                color: "var(--text)",
              }}
            >
              2
            </div>
            <p
              className="font-bold text-sm mb-1 transition-all duration-300"
              style={{ color: "var(--text)" }}
            >
              Carlos Ruiz
            </p>
            <p
              className="text-[10px] font-mono mb-4 uppercase tracking-widest transition-all duration-300"
              style={{ color: "var(--text-muted)" }}
            >
              Mecatrónica B
            </p>
            <span
              className="text-xs font-mono font-bold transition-all duration-300"
              style={{ color: "var(--primary)" }}
            >
              11,800 XP
            </span>
          </div>
        </div>

        {/* Primer lugar */}
        <div className="order-1 md:order-2">
          <div
            className="border-2 p-8 text-center flex flex-col items-center relative transform scale-105 transition-all duration-300 hover:shadow-2xl hover:scale-110"
            style={{
              borderColor: "var(--primary)",
              backgroundColor: "rgba(var(--primary-rgb), 0.05)",
              boxShadow: "0 0 30px rgba(var(--primary-rgb), 0.1)",
            }}
          >
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 font-mono font-bold text-[10px] tracking-widest uppercase transition-all duration-300"
              style={{ backgroundColor: "var(--primary)", color: "var(--bg)" }}
            >
              Líder
            </div>
            <div
              className="w-16 h-16 flex items-center justify-center border font-black text-xl mb-4 transition-all duration-300"
              style={{
                backgroundColor: "var(--primary)",
                borderColor: "var(--primary)",
                color: "var(--bg)",
              }}
            >
              1
            </div>
            <p
              className="font-bold text-lg mb-1 transition-all duration-300"
              style={{ color: "var(--text)" }}
            >
              Ana Sofía Lopez
            </p>
            <p
              className="text-[10px] font-mono mb-4 uppercase tracking-widest transition-all duration-300"
              style={{ color: "var(--text-muted)" }}
            >
              Robótica A
            </p>
            <span
              className="text-sm font-mono font-bold transition-all duration-300"
              style={{ color: "var(--primary)" }}
            >
              12,500 XP
            </span>
          </div>
        </div>

        {/* Tercer lugar */}
        <div className="order-3 pt-12">
          <div
            className="border border-border p-6 text-center flex flex-col items-center transition-all duration-300 hover:shadow-lg hover:scale-105"
            style={{ backgroundColor: "var(--bg)" }}
          >
            <div
              className="w-10 h-10 flex items-center justify-center border border-border font-bold mb-4 transition-all duration-300"
              style={{
                backgroundColor: "var(--surface)",
                color: "var(--text)",
              }}
            >
              3
            </div>
            <p
              className="font-bold text-sm mb-1 transition-all duration-300"
              style={{ color: "var(--text)" }}
            >
              Elena García
            </p>
            <p
              className="text-[10px] font-mono mb-4 transition-all duration-300"
              style={{ color: "var(--text-muted)" }}
            >
              Robótica A
            </p>
            <span
              className="text-xs font-mono font-bold transition-all duration-300"
              style={{ color: "var(--primary)" }}
            >
              11,250 XP
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de ranking */}
      <div
        className="border border-border transition-all duration-300"
        style={{ backgroundColor: "var(--bg)" }}
      >
        {/* Header de la tabla */}
        <div
          className="p-4 border-b border-border flex justify-between items-center transition-all duration-300"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <h2
            className="text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-300"
            style={{ color: "var(--text)" }}
          >
            Top 50 Estudiantes
          </h2>
          <div className="flex gap-4 text-[9px] font-mono uppercase tracking-widest">
            <button
              onClick={() => setActiveTab("global")}
              className={`border-b-2 px-2 pb-1 transition-all duration-200 ${activeTab === "global" ? "border-primary text-primary scale-105" : "text-text-muted hover:text-text hover:scale-105"}`}
            >
              Global
            </button>
            <button
              onClick={() => setActiveTab("group")}
              className={`border-b-2 px-2 pb-1 transition-all duration-200 ${activeTab === "group" ? "border-primary text-primary scale-105" : "text-text-muted hover:text-text hover:scale-105"}`}
            >
              Mi Grupo
            </button>
          </div>
        </div>

        {/* Lista de ranking */}
        <div className="divide-y" style={{ backgroundColor: "var(--bg)" }}>
          {MOCK_RANKING.map((user) => (
            <div
              key={user.id}
              className="flex items-center p-4 hover:bg-surface transition-all duration-300"
              style={{ borderColor: "rgba(var(--border-rgb), 0.5)" }}
            >
              <div
                className="w-10 font-mono font-bold text-center text-xs transition-all duration-300"
                style={{ color: "var(--text-muted)" }}
              >
                {user.rank}
              </div>
              <div
                className="w-10 h-10 border flex items-center justify-center font-bold text-xs mr-4 transition-all duration-300"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              >
                {user.avatar}
              </div>
              <div className="flex-1">
                <p
                  className="text-xs font-bold transition-all duration-300"
                  style={{ color: "var(--text)" }}
                >
                  {user.name}
                </p>
                <p
                  className="text-[10px] uppercase tracking-widest transition-all duration-300"
                  style={{ color: "var(--text-muted)" }}
                >
                  {user.group}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-xs font-mono font-bold transition-all duration-300"
                  style={{ color: "var(--primary)" }}
                >
                  {user.xp.toLocaleString()} XP
                </p>
                <span
                  className={`material-symbols-outlined text-sm transition-all duration-300 ${
                    user.trend === "up"
                      ? "text-green-500"
                      : user.trend === "down"
                        ? "text-red-500"
                        : "opacity-30"
                  }`}
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
          className="p-4 text-center transition-all duration-300"
          style={{ backgroundColor: "var(--bg)" }}
        >
          <button
            className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:underline transition-all duration-300 hover:text-primary"
            style={{ color: "var(--text-muted)" }}
          >
            Ver lista completa
          </button>
        </div>
      </div>
    </main>
  );
};

export default RankingPage;
