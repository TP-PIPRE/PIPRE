"""Independent bounded backtracking solver. Does not read construction witnesses.

Checks the frozen catalog and discovers a legal solution for every official board.
Only an offline verification tool; no ML/runtime generator or scoring policy.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Independently encoded four-cell shapes; rotations only, never reflections.
SHAPES = {"O": ((0,0),(1,0),(0,1),(1,1)), "I": ((0,0),(1,0),(2,0),(3,0)),
          "T": ((0,0),(1,0),(2,0),(1,1)), "S": ((1,0),(2,0),(0,1),(1,1)),
          "Z": ((0,0),(1,0),(1,1),(2,1)), "L": ((0,0),(0,1),(0,2),(1,2)), "J": ((1,0),(1,1),(0,2),(1,2))}


def solve(config, limit=300000):
    size = config["boardSize"]["rows"]
    blocked = {(p["x"],p["y"]) for p in config["blockedCells"]}
    required = {(p["x"],p["y"]) for p in config["requiredCells"]}
    rows = [c["targetCount"] for c in config["constraints"] if c["orientation"]=="row"]
    cols = [c["targetCount"] for c in config["constraints"] if c["orientation"]=="column"]
    inventory = config["inventory"]
    assert len(inventory) in (3,4) and sum(rows)==sum(cols)==4*len(inventory)
    frequency = [sum(q["type"]==p["type"] for q in inventory) for p in inventory]
    assert max(frequency)<=2 and frequency.count(2)<=2
    assert len({p["id"] for p in inventory})==len(inventory)
    assert len(blocked)+4*len(inventory)<=size*size
    options = {}
    for p in inventory:
        shape = SHAPES[p["type"]]
        candidates = []
        for r in (0,90,180,270):
            allowed = next((rule["allowed"] for rule in config["orientations"] if rule["pieceId"]==p["id"]),[0,90,180,270])
            if r in allowed:
                for y in range(size):
                    for x in range(size):
                        cells = {(x+dx,y+dy) for dx,dy in shape}
                        if all(0<=cx<size and 0<=cy<size for cx,cy in cells) and not cells & blocked:
                            rc = [sum(cy==i for cx,cy in cells) for i in range(size)]
                            cc = [sum(cx==i for cx,cy in cells) for i in range(size)]
                            if all(a<=b for a,b in zip(rc,rows)) and all(a<=b for a,b in zip(cc,cols)):
                                candidates.append((cells,rc,cc,dict(id=p["id"],rotation=r,position=dict(x=x,y=y))))
            turned = [(-dy,dx) for dx,dy in shape]
            mx,my = min(x for x,y in turned),min(y for x,y in turned)
            shape = [(x-mx,y-my) for x,y in turned]
        options[p["id"]]=candidates
    visited = 0

    def search(occupied, placed, rr, cc):
        nonlocal visited
        visited+=1
        if visited>limit:
            raise RuntimeError(f"Solver budget exhausted: {config['templateId']}")
        if len(placed)==len(inventory):
            return [] if rr==rows and cc==cols and required<=occupied else None
        eligible = [p["id"] for p in inventory if p["id"] not in placed and all(e["before"] in placed for e in config["precedences"] if e["after"]==p["id"])]
        # Deterministic most-constrained variable, constrained by legal first-placement order.
        pid = min(eligible,key=lambda p:len(options[p]))
        for cells,dr,dc,witness in options[pid]:
            if cells & occupied: continue
            nr,nc = [a+b for a,b in zip(rr,dr)],[a+b for a,b in zip(cc,dc)]
            if any(a>b for a,b in zip(nr,rows)) or any(a>b for a,b in zip(nc,cols)):continue
            contacts = [e for e in config["contacts"] if pid in (e["first"],e["second"])]
            if any(other in placed and not any(abs(x-u)+abs(y-v)==1 for x,y in cells for u,v in placed[other]) for e in contacts for other in [e["second"] if e["first"]==pid else e["first"]]): continue
            result = search(occupied|cells,{**placed,pid:cells},nr,nc)
            if result is not None:return [witness]+result
        return None

    result = search(set(),{},[0]*size,[0]*size)
    assert result is not None, f"Unsolvable {config['templateId']}"
    return dict(templateId=config["templateId"],nodes=visited,placements=result)


if __name__=="__main__":
    catalog=json.loads((ROOT/"frontend/src/shared/constants/tetrilogicCatalog.json").read_text(encoding="utf-8"))
    assert len(catalog)==30 and len({c["templateId"] for c in catalog})==30
    results=[solve(c) for c in catalog]
    print(json.dumps(results,indent=2))
