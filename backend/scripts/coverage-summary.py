"""Summarize the unfiltered JaCoCo report; no runtime dependencies."""
import json
from pathlib import Path
import xml.etree.ElementTree as ET

BACKEND = Path(__file__).resolve().parents[1]
CRITICAL = {
    "BoardRules", "AchievementRules", "GameSessionsService", "GamificationService",
    "ProceduralDailyGenerator", "ProceduralDailyService", "RandomDailySelectionPolicy",
    "SaveModuleProgressService", "SaveResultService", "CreateSimulationService",
    "AddStudentRankingService", "RemoveStudentRankingService",
}


def counters(element):
    result = {}
    for counter in element.findall("counter"):
        missed, covered = int(counter.get("missed")), int(counter.get("covered"))
        result[counter.get("type")] = {
            "covered": covered, "missed": missed,
            "percent": round(100 * covered / (covered + missed), 2) if covered + missed else None,
        }
    return result


if __name__ == "__main__":
    report = ET.parse(BACKEND / "target/site/jacoco/jacoco.xml").getroot()
    classes, packages = {}, {}
    for package in report.findall("package"):
        packages[package.get("name")] = counters(package)
        for cls in package.findall("class"):
            name = cls.get("name").rsplit("/", 1)[-1]
            if name in CRITICAL:
                classes[name] = counters(cls)
    missing = CRITICAL - classes.keys()
    if missing:
        raise SystemExit(f"Missing critical classes in coverage report: {sorted(missing)}")
    totals = {}
    for kind in ("LINE", "BRANCH"):
        covered = sum(c.get(kind, {}).get("covered", 0) for c in classes.values())
        missed = sum(c.get(kind, {}).get("missed", 0) for c in classes.values())
        totals[kind] = {"covered": covered, "missed": missed, "percent": round(100 * covered / (covered + missed), 2)}
    summary = {"overall": counters(report), "critical": totals, "criticalClasses": classes, "packages": packages}
    output = BACKEND / "target/coverage-summary.json"
    output.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"overall": summary["overall"], "critical": totals}, indent=2))
    for name, value in sorted(classes.items()):
        print(f'{name}: lines={value.get("LINE", {}).get("percent")}% branches={value.get("BRANCH", {}).get("percent")}%')
