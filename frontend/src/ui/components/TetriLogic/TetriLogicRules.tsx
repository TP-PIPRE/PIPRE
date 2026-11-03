import { ArrowRight, Link2 } from "lucide-react";
import type { LevelConfig } from "../../../shared/types/TetriLogic";
import { shapeAt } from "../../../application/usecases/tetrilogic/rules";
import { PiecePreview } from "./PiecePreview";

export function TetriLogicRules({ level, pieceNumbers }: { level: LevelConfig; pieceNumbers: Record<string, number> }) {
  function token(id: string) {
    const piece = level.inventory!.find(p => p.id === id)!;
    return <span className="tetri-rule-piece" role="img" aria-label={`Pieza ${pieceNumbers[id]}`}>
      <span className="tetri-token-number" aria-hidden="true">{pieceNumbers[id]}</span>
      <PiecePreview piece={{ ...piece, shape: shapeAt(piece.type, 0) }} cellSize={7} />
    </span>;
  }
  return <section aria-label="Reglas del reto" className="tetri-rule-content">
    <h2>Reglas del reto</h2>
    {!!level.precedences?.length && <div className="tetri-rule-group">
      <h3>Coloca antes</h3>
      <p>Sólo al entrar al tablero. Después puedes moverlas.</p>
      <ul>{level.precedences.map(rule => <li key={`${rule.before}:${rule.after}`}>
        {token(rule.before)}<ArrowRight size={16} aria-hidden="true" /><span className="sr-only">antes de</span>{token(rule.after)}
      </li>)}</ul>
    </div>}
    {!!level.contacts?.length && <div className="tetri-rule-group">
      <h3>Deben tocarse</h3>
      <p>Por un lado, no sólo en diagonal.</p>
      <ul>{level.contacts.map(rule => <li key={`${rule.first}:${rule.second}`}>
        {token(rule.first)}<Link2 size={16} aria-hidden="true" /><span className="sr-only">debe compartir un lado con</span>{token(rule.second)}
      </li>)}</ul>
    </div>}
    {!!level.orientations?.length && <div className="tetri-rule-group">
      <h3>Giro al terminar</h3>
      {level.orientations.map(rule => {
        const piece = level.inventory!.find(p => p.id === rule.pieceId)!;
        return <div key={rule.pieceId} className="tetri-orientation-rule">
          <p>Pieza {pieceNumbers[rule.pieceId]}: una de estas posiciones.</p>
          <div className="tetri-orientation-options">{rule.allowed.map(angle => <span key={angle} className="tetri-orientation-option" role="img" aria-label={`Pieza ${pieceNumbers[rule.pieceId]} a ${angle} grados`}>
            <PiecePreview piece={{ ...piece, shape: shapeAt(piece.type, angle) }} cellSize={9} />
            <span aria-hidden="true">{angle}°</span>
          </span>)}</div>
        </div>;
      })}
    </div>}
  </section>;
}

/** Keep every teacher instruction available, showing repeated objectives just once. */
export function TetriLogicInstructions({ description, missions, defaultDescription }: {
  description?: string | null;
  missions?: { id: string; title: string; objective: string }[];
  defaultDescription?: string;
}) {
  if (!description && !missions?.length) return null;
  const normalize = (text?: string | null) => text?.trim().replace(/\s+/g, " ") ?? "";
  const isCustom = Boolean(description && normalize(description) !== normalize(defaultDescription))
    || Boolean(missions?.some(m => normalize(m.objective) !== normalize(defaultDescription)));
  const seen = new Set([normalize(description)]);
  return <details className="tetri-instructions" open={isCustom}>
    <summary>Instrucciones del reto</summary>
    <section aria-label="Misiones del reto">
      {description && <p>{description}</p>}
      {missions?.map(m => {
        const repeated = seen.has(normalize(m.objective));
        seen.add(normalize(m.objective));
        return <div key={m.id}><strong>{m.title}</strong>{!repeated && <p>{m.objective}</p>}</div>;
      })}
    </section>
  </details>;
}
