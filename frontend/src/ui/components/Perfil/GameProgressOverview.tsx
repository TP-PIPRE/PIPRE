import { CircuitBoard, Shapes, Star } from "lucide-react";
import type { GameProgressDTO } from "../../../infrastructure/api/models/gameProgressModels";

export function GameProgressOverview({ progress }: { progress: GameProgressDTO }) {
  return <section className="space-y-4" aria-labelledby="game-progress-title">
    <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 id="game-progress-title" className="text-lg font-semibold">Progreso por simulador</h2><p className="text-sm text-text-muted">{progress.completedLevels}/{progress.totalLevels} niveles completados · {progress.totalStars} estrellas</p></div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{(["neonflow", "tetrilogic"] as const).map(game => {
      const items = progress.levels.filter(level => level.game === game).sort((a, b) => a.levelNumber - b.levelNumber);
      const Icon = game === "neonflow" ? CircuitBoard : Shapes;
      return <article key={game} className="rounded-xl border border-border bg-surface p-4"><h3 className="mb-4 flex items-center gap-2 font-semibold"><Icon size={20} aria-hidden="true" />{game === "neonflow" ? "Neon Flow" : "TetriLogic"}<span className="ml-auto text-sm font-normal text-text-muted">{items.filter(level => level.completed).length}/30</span></h3><ol className="grid grid-cols-5 gap-2 sm:grid-cols-6">{items.map(level => <li key={level.levelNumber} aria-label={`Nivel ${level.levelNumber}: ${level.completed ? `${level.bestStars} de 3 estrellas` : "pendiente"}`} className={`rounded-lg border px-1 py-2 text-center ${level.completed ? "border-primary bg-primary/5" : "border-border"}`}><span className="font-mono text-sm">{level.levelNumber}</span><span className="mt-1 flex justify-center gap-0.5" aria-hidden="true">{[1, 2, 3].map(star => <Star key={star} size={10} className={star <= level.bestStars ? "fill-primary text-primary" : "text-text-muted"} />)}</span></li>)}</ol></article>;
    })}</div>
  </section>;
}
