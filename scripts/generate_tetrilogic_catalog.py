"""Build the reviewed, deterministic official catalog. Not a runtime/daily generator.

Public configurations contain no solved positions. Witnesses stay in test fixtures.
Run with --check to detect drift between generated frontend/backend/SQL artifacts.
"""
import argparse
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHAPES = {
    "O": [(0, 0), (1, 0), (0, 1), (1, 1)],
    "I": [(0, 0), (1, 0), (2, 0), (3, 0)],
    "T": [(0, 0), (1, 0), (2, 0), (1, 1)],
    "S": [(1, 0), (2, 0), (0, 1), (1, 1)],
    "Z": [(0, 0), (1, 0), (1, 1), (2, 1)],
    "L": [(0, 0), (0, 1), (0, 2), (1, 2)],
    "J": [(1, 0), (1, 1), (0, 2), (1, 2)],
}
TITLES = [
    "Primer encuentro", "Giro de perspectiva", "El hueco cuenta", "Formas en diálogo", "Una decisión previa",
    "Un espacio mayor", "Escalera de celdas", "Dos caminos", "Encuentro de esquinas", "Plan antes de actuar",
    "Columnas desiguales", "Ritmo de tres", "La cuarta pieza", "Conexiones", "Orientaciones compartidas",
    "Filas en equilibrio", "Paso a paso", "Espacios reservados", "Cruce de condiciones", "Plan completo",
    "Horizonte de seis", "Patrón abierto", "Conexión obligatoria", "Cuatro decisiones", "Lectura de columnas",
    "Límites y giros", "Orden y contacto", "Alternativas válidas", "Síntesis de patrones", "Integración final",
]


def normalized(shape):
    mx, my = min(x for x, y in shape), min(y for x, y in shape)
    return sorted((x - mx, y - my) for x, y in shape)


def rotated(kind, turns):
    shape = SHAPES[kind]
    for _ in range(turns):
        shape = normalized([(-y, x) for x, y in shape])
    return shape


def point(p):
    return dict(x=p[0], y=p[1])


def make_level(n):
    size = 4 if n <= 5 else 5 if n <= 20 else 6
    count = 3 if n <= 5 or n % 3 == 0 else 4
    rng = random.Random(20261026 + n)
    for _ in range(10000):
        # No shape repeats except one intentional pair in selected later levels.
        kinds = rng.sample(list(SHAPES), count)
        if n > 8 and n % 4 == 0:
            kinds[-1] = kinds[0]
        occupied, witness, inventory = set(), [], []
        for i, kind in enumerate(kinds):
            candidates = []
            for turns in range(4):
                shape = rotated(kind, turns)
                for y in range(size - max(y for x, y in shape)):
                    for x in range(size - max(x for x, y in shape)):
                        cells = {(x + dx, y + dy) for dx, dy in shape}
                        touch = not occupied or any((cx + dx, cy + dy) in occupied for cx, cy in cells for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)])
                        if not cells & occupied and touch:
                            candidates.append((turns, x, y, cells))
            if not candidates:
                break
            turns, x, y, cells = rng.choice(candidates)
            pid = f"{kind.lower()}{sum(k == kind for k in kinds[:i]) + 1}"
            inventory.append(dict(id=pid, type=kind))
            witness.append(dict(id=pid, rotation=turns * 90, position=point((x, y))))
            occupied |= cells
        if len(witness) != count or not any(w["rotation"] and p["type"] not in ("O",) for w, p in zip(witness, inventory)):
            continue
        free = sorted({(x, y) for y in range(size) for x in range(size)} - occupied)
        blocked = rng.sample(free, min(len(free), 1 + (n - 1) // 6))
        rows = [sum(y == row for x, y in occupied) for row in range(size)]
        cols = [sum(x == col for x, y in occupied) for col in range(size)]
        # Require complete counts, including zero targets. At least one anchor encodes a pattern.
        required = rng.sample(sorted(occupied), 1 if n <= 10 else 2 if n <= 20 else 3)
        edges = [dict(before=inventory[i - 1]["id"], after=inventory[i]["id"]) for i in range(1, 2 if n <= 10 else count)]
        # The construction places every piece touching an earlier one; record an actual pair.
        cells_by_id = {}
        for p, w in zip(inventory, witness):
            cells_by_id[p["id"]] = {(w["position"]["x"] + x, w["position"]["y"] + y) for x, y in rotated(p["type"], w["rotation"] // 90)}
        contacts = []
        for i in range(1, 2 if n <= 10 else count):
            second = inventory[i]["id"]
            first = next(p["id"] for p in inventory[:i] if any((x + dx, y + dy) in cells_by_id[p["id"]] for x, y in cells_by_id[second] for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]))
            contacts.append(dict(first=first, second=second))
        orientation = []
        if n > 10:
            i = next(i for i, p in enumerate(inventory) if p["type"] != "O")
            orientation = [dict(pieceId=inventory[i]["id"], allowed=[witness[i]["rotation"], (witness[i]["rotation"] + 180) % 360])]
        dim = ["Reconocimiento de patrones", "Análisis lógico", "Resolución de problemas"][(n - 1) % 3]
        description = f"Coloca las {count} piezas y cumple todos los conteos de filas y columnas. Cubre las celdas marcadas, respeta el orden y los contactos indicados; pueden quedar espacios vacíos."
        config = dict(level=n, templateId=f"tetrilogic-v2-{n}", version=2, title=TITLES[n - 1], description=description,
                      cognitiveDimension=dim, boardSize=dict(rows=size, cols=size), blockedCells=list(map(point, blocked)),
                      constraints=[dict(line=i, orientation=o, targetCount=v) for o, values in [("row", rows), ("column", cols)] for i, v in enumerate(values)],
                      inventory=inventory, requiredCells=list(map(point, required)), precedences=edges, contacts=contacts,
                      orientations=orientation, referenceMoves=count + sum(w["rotation"] // 90 for p, w in zip(inventory, witness) if p["type"] != "O"),
                      hints=dict(general=f"En este tablero, la fila {rows.index(min(rows)) + 1} necesita {min(rows)} celdas y la columna {cols.index(min(cols)) + 1} necesita {min(cols)}. Compara estos conteos antes de colocar las piezas.",
                                 specific=f"Coloca {inventory[0]['id'].upper()} antes de {inventory[1]['id'].upper()}. Al terminar deben compartir un lado. La celda marcada en fila {required[0][1] + 1}, columna {required[0][0] + 1} debe estar ocupada; no tiene que ser por una pieza concreta."))
        return config, witness
    raise RuntimeError(f"Cannot construct level {n}")


def sql_quote(value):
    return "'" + value.replace("'", "''") + "'"


def artifacts():
    pairs = [make_level(n) for n in range(1, 31)]
    catalog = [p[0] for p in pairs]
    payload = json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"
    sql = ["-- Generated by scripts/generate_tetrilogic_catalog.py. Additive, never edit applied migrations.",
           "-- Freeze complete, versioned board configurations separately from student results.",
           "CREATE TABLE tetrilogic_templates (template_id VARCHAR(40) PRIMARY KEY, version INTEGER NOT NULL CHECK (version > 0), config JSONB NOT NULL);",
           "INSERT INTO courses (id_course,name,description,level,created_at) VALUES ('c002','TetriLogic','Razonamiento espacial y patrones','MEDIUM',CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;",
           "INSERT INTO modules (id_module,id_course,title) VALUES ('mod-c002-r1','c002','Razonamiento Espacial y Patrones') ON CONFLICT DO NOTHING;",
           "INSERT INTO lessons (id_lesson,id_module,title) VALUES ('les-c002-r1','mod-c002-r1','Introducción a TetriLogic') ON CONFLICT DO NOTHING;",
           "-- Track only rows introduced by this migration, never attach missions to an edited existing activity.",
           "CREATE TEMPORARY TABLE tetrilogic_new_activities (id_activity VARCHAR(36) PRIMARY KEY);",
           "CREATE TEMPORARY TABLE tetrilogic_prototype_upgrades (id_activity VARCHAR(36) PRIMARY KEY);"]
    for c, witness in pairs:
        n, tid = c["level"], c["templateId"]
        conf = json.dumps(c, ensure_ascii=False, separators=(",", ":"))
        sql.append(f"INSERT INTO tetrilogic_templates VALUES ({sql_quote(tid)},2,JSON {sql_quote(conf)}) ON CONFLICT DO NOTHING;")
        name = f"TetriLogic - Nivel {n}"
        difficulty, logic = ("EASY", "LOW") if n <= 10 else ("MEDIUM", "MEDIUM") if n <= 20 else ("HARD", "HIGH")
        vals = [f"act-c002-{n}", "les-c002-r1", name, logic, difficulty, difficulty, "robotics", "tetrilogic", c["description"], tid]
        sql.append(f"INSERT INTO tetrilogic_new_activities SELECT 'act-c002-{n}' WHERE NOT EXISTS (SELECT 1 FROM activities WHERE id_activity='act-c002-{n}');")
        sql.append("INSERT INTO activities (id_activity,id_lesson,name,logic_level,complexity,difficulty,type,environment,description,level_template,display_order,start_x,start_z,target_x,target_z) VALUES (" + ",".join(map(sql_quote, vals)) + f",{n},0,0,0,0) ON CONFLICT DO NOTHING;")
        sql.append(f"INSERT INTO activity_missions (id_mission,id_activity,title,objective,max_blocks) SELECT 'mis-c002-v2-{n}', 'act-c002-{n}', {sql_quote(c['title'])}, {sql_quote(c['description'])},0 WHERE EXISTS (SELECT 1 FROM tetrilogic_new_activities WHERE id_activity='act-c002-{n}') ON CONFLICT DO NOTHING;")
    # Upgrade prototypes only if ALL original seeded editable values and mission still match.
    originals = [(1, "LOW", "EASY", "Cubre el tablero 4x4", "Encaja los Tetriminos para cubrir el tablero cumpliendo el conteo de celdas por fila y columna."),
                 (2, "MEDIUM", "MEDIUM", "Esquiva las celdas bloqueadas", "Encaja los Tetriminos respetando las celdas bloqueadas de la fila inferior del tablero.")]
    for n, logic, diff, title, objective in originals:
        c = catalog[n - 1]
        sql.append(f"""INSERT INTO tetrilogic_prototype_upgrades
 SELECT a.id_activity FROM activities a
 WHERE a.id_activity='act-c002-{n}' AND a.id_lesson='les-c002-r1' AND a.name='TetriLogic - Nivel {n}'
 AND a.environment='tetrilogic' AND a.level_template='tetrilogic-{n}' AND a.logic_level='{logic}'
 AND a.difficulty='{diff}' AND a.complexity='{diff}' AND a.type='robotics' AND a.display_order={n}
 AND a.start_x=0 AND a.start_z=0 AND a.target_x=0 AND a.target_z=0 AND a.description={sql_quote(objective)}
 AND (SELECT count(*) FROM activity_missions m WHERE m.id_activity=a.id_activity)=1
 AND EXISTS (SELECT 1 FROM activity_missions m WHERE m.id_activity=a.id_activity AND m.title={sql_quote(title)} AND m.objective={sql_quote(objective)} AND m.max_blocks=0)
;
UPDATE activities SET level_template='tetrilogic-v2-{n}', description={sql_quote(c['description'])}, display_order={n}
WHERE id_activity='act-c002-{n}' AND id_activity IN (SELECT id_activity FROM tetrilogic_prototype_upgrades);
UPDATE activity_missions SET title={sql_quote(c['title'])}, objective={sql_quote(c['description'])}
WHERE id_activity='act-c002-{n}' AND id_activity IN (SELECT id_activity FROM tetrilogic_prototype_upgrades);""")
    sql.extend(["DROP TABLE tetrilogic_prototype_upgrades;", "DROP TABLE tetrilogic_new_activities;"])
    return {
        "frontend/src/shared/constants/tetrilogicCatalog.json": payload,
        "backend/src/main/resources/catalog/tetrilogic-v2.json": payload,
        "frontend/tests/fixtures/tetrilogicSolutions.json": json.dumps([dict(templateId=c["templateId"], placements=w) for c, w in pairs], indent=2) + "\n",
        "backend/src/main/resources/db/migration/V14__tetrilogic_official_catalog.sql": "\n".join(sql) + "\n",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    for relative, content in artifacts().items():
        path = ROOT / relative
        if args.check:
            assert path.read_text(encoding="utf-8") == content, f"Catalog drift: {relative}"
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
    print("30 versioned configurations, test witnesses and additive V14: OK")
