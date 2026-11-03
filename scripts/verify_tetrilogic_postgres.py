"""Run real PostgreSQL 16 migration checks in a disposable, network-isolated container.

Uses only Python's standard library and the already installed postgres:16-alpine
image. Never connects to the application database or starts any other service.
The container has no published ports, no network, and only temporary storage.
"""
import json
import re
import subprocess
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "backend/src/main/resources/db/migration"
OBJECTIVES = {
    1: "Encaja los Tetriminos para cubrir el tablero cumpliendo el conteo de celdas por fila y columna.",
    2: "Encaja los Tetriminos respetando las celdas bloqueadas de la fila inferior del tablero.",
}


def sql_string(value):
    return "'" + value.replace("'", "''") + "'"


def command(args, input_text=None, check=True):
    result = subprocess.run(args, input=input_text, text=True, encoding="utf-8", capture_output=True)
    if check and result.returncode:
        raise RuntimeError("Command failed: " + " ".join(args[:5]) + "\n" + result.stderr)
    return result


class Verification:
    def __init__(self):
        self.name = "pipre-tetri-pg-check-" + uuid.uuid4().hex[:8]
        self.container_id = None
        self.checks = []

    def start(self):
        # Do not pull/install a different image or mutate an existing container.
        command(["docker", "image", "inspect", "postgres:16-alpine"])
        result = command(["docker", "run", "-d", "--name", self.name,
                          "--label", "pipre.qa=tetrilogic-catalog", "--network", "none",
                          "--tmpfs", "/var/lib/postgresql/data", "--memory", "256m",
                          "-e", "POSTGRES_HOST_AUTH_METHOD=trust", "postgres:16-alpine"])
        self.container_id = result.stdout.strip()
        for _ in range(100):
            # The image briefly starts a temporary initialization server first.
            # Wait for the final server so later SQL cannot race its shutdown.
            logs = command(["docker", "logs", self.name], check=False)
            initialized = "PostgreSQL init process complete" in logs.stdout + logs.stderr
            if initialized and command(["docker", "exec", self.name, "pg_isready", "-U", "postgres"], check=False).returncode == 0:
                return
            time.sleep(.3)
        raise RuntimeError("Temporary PostgreSQL did not become ready")

    def close(self):
        if not self.container_id:
            return
        identity = command(["docker", "inspect", self.name, "--format", "{{.Id}} {{index .Config.Labels \"pipre.qa\"}}"], check=False)
        if identity.returncode == 0 and identity.stdout.strip() == self.container_id + " tetrilogic-catalog":
            command(["docker", "rm", "-f", self.container_id])
        else:
            raise RuntimeError("Container identity changed; automatic cleanup refused")

    def sql(self, database, text, expected_failure=False):
        result = command(["docker", "exec", "-i", self.name, "psql", "-X", "-q", "-A", "-t",
                          "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1", "-1", "-f", "-"], text, check=False)
        if expected_failure:
            assert result.returncode != 0, "Expected invalid transaction to fail"
        elif result.returncode:
            raise RuntimeError("SQL failed in " + database + ":\n" + result.stderr)
        return result.stdout.strip()

    def equal(self, database, query, expected, title):
        actual = self.sql(database, query)
        assert actual == str(expected), f"{title}: expected {expected!r}, got {actual!r}"
        self.checks.append(title)

    def database(self, name, through=13):
        command(["docker", "exec", self.name, "createdb", "-U", "postgres", name])
        paths = sorted(MIGRATIONS.glob("V*__*.sql"), key=lambda p: int(re.match(r"V(\d+)", p.name)[1]))
        scripts = [p.read_text(encoding="utf-8") for p in paths if int(re.match(r"V(\d+)", p.name)[1]) <= through]
        self.sql(name, "\n".join(scripts))

    def prototype(self, database, n):
        difficulty = "EASY" if n == 1 else "MEDIUM"
        logic = "LOW" if n == 1 else "MEDIUM"
        title = "Cubre el tablero 4x4" if n == 1 else "Esquiva las celdas bloqueadas"
        self.sql(database, f"""
INSERT INTO activities (id_activity,id_lesson,name,logic_level,complexity,difficulty,type,environment,description,level_template,display_order,start_x,start_z,target_x,target_z)
VALUES ('act-c002-{n}','les-c002-r1','TetriLogic - Nivel {n}','{logic}','{difficulty}','{difficulty}','robotics','tetrilogic',{sql_string(OBJECTIVES[n])},'tetrilogic-{n}',{n},0,0,0,0);
INSERT INTO activity_missions (id_mission,id_activity,title,objective,max_blocks)
VALUES ('original-mission-{n}','act-c002-{n}',{sql_string(title)},{sql_string(OBJECTIVES[n])},0);
""")

    def original_course(self, database):
        self.sql(database, """
INSERT INTO courses (id_course,name,description) VALUES ('c002','Curso editado','Descripción docente');
INSERT INTO modules (id_module,id_course,title) VALUES ('mod-c002-r1','c002','Módulo editado');
INSERT INTO lessons (id_lesson,id_module,title) VALUES ('les-c002-r1','mod-c002-r1','Lección editada');
""")
        self.prototype(database, 1)
        self.prototype(database, 2)
        # Historical references must survive the upgrade unchanged.
        self.sql(database, """
INSERT INTO simulations (id_simulation,id_activity,result) VALUES ('historical-simulation','act-c002-1','SUCCESS');
INSERT INTO activity_results (id_result,id_activity,score) VALUES ('historical-result','act-c002-2',73);
""")

    def run(self):
        self.start()
        version = self.sql("postgres", "SELECT version();")
        migration = (MIGRATIONS / "V14__tetrilogic_official_catalog.sql").read_text(encoding="utf-8")
        followup = (MIGRATIONS / "V15__upgrade_legacy_tetrilogic_prototypes.sql").read_text(encoding="utf-8")

        self.database("qa_fresh", 15)
        for table in ("tetrilogic_templates", "activities", "activity_missions"):
            self.equal("qa_fresh", f"SELECT count(*) FROM {table};", 30, "Fresh install: thirty " + table)
        self.equal("qa_fresh", "SELECT count(*) FROM tetrilogic_templates WHERE jsonb_typeof(config)='object';", 30, "JSONB configurations are objects")
        self.equal("qa_fresh", "SELECT count(*) FROM activities a JOIN tetrilogic_templates t ON a.level_template=t.template_id JOIN lessons l ON a.id_lesson=l.id_lesson JOIN modules m ON l.id_module=m.id_module WHERE m.id_course='c002';", 30, "Thirty complete course-to-board links")
        self.equal("qa_fresh", "SELECT count(DISTINCT display_order) FROM activities;", 30, "Thirty unique display orders")
        stored = json.loads(self.sql("qa_fresh", "SELECT json_object_agg(template_id,config)::text FROM tetrilogic_templates;"))
        expected = {c["templateId"]: c for c in json.loads((ROOT / "frontend/src/shared/constants/tetrilogicCatalog.json").read_text(encoding="utf-8"))}
        assert stored == expected, "Persisted catalog differs from reviewed frontend configurations"
        self.checks.append("All thirty persisted JSON configurations match the reviewed catalog")
        self.sql("qa_fresh", "INSERT INTO activities (id_activity,id_lesson,name) VALUES ('invalid-lesson','missing-lesson','Invalid');", expected_failure=True)
        self.equal("qa_fresh", "SELECT count(*) FROM activities;", 30, "Foreign key rejects an orphan without inserting rows")

        self.database("qa_original")
        self.original_course("qa_original")
        self.sql("qa_original", migration)
        self.sql("qa_original", followup)
        self.equal("qa_original", "SELECT count(*) FROM activities;", 30, "Existing catalog gains only the twenty-eight missing activities")
        for n in (1, 2):
            self.equal("qa_original", f"SELECT level_template FROM activities WHERE id_activity='act-c002-{n}';", f"tetrilogic-v2-{n}", f"Original prototype {n} upgrades")
        self.equal("qa_original", "SELECT title FROM activity_missions WHERE id_mission='original-mission-1';", "Primer encuentro", "Mission one keeps identity and receives the new objective")
        self.equal("qa_original", "SELECT title FROM activity_missions WHERE id_mission='original-mission-2';", "Giro de perspectiva", "Mission two keeps identity and receives the new objective")
        self.equal("qa_original", "SELECT name||'|'||description FROM courses WHERE id_course='c002';", "Curso editado|Descripción docente", "Course edits preserved")
        self.equal("qa_original", "SELECT title FROM modules WHERE id_module='mod-c002-r1';", "Módulo editado", "Module edit preserved")
        self.equal("qa_original", "SELECT title FROM lessons WHERE id_lesson='les-c002-r1';", "Lección editada", "Lesson edit preserved")
        self.equal("qa_original", "SELECT id_activity||'|'||result FROM simulations WHERE id_simulation='historical-simulation';", "act-c002-1|SUCCESS", "Historical simulation and activity identity preserved")
        self.equal("qa_original", "SELECT id_activity||'|'||score FROM activity_results WHERE id_result='historical-result';", "act-c002-2|73.00", "Historical result and score preserved")

        self.database("qa_edited")
        self.original_course("qa_edited")
        self.sql("qa_edited", """
UPDATE activities SET name='Mi reto editado',description='Texto docente',display_order=42 WHERE id_activity='act-c002-1';
UPDATE activity_missions SET objective='Misión docente',max_blocks=9 WHERE id_activity='act-c002-2';
INSERT INTO activities (id_activity,id_lesson,name,environment,level_template) VALUES ('act-c002-3','les-c002-r1','Mi plantilla v2 sin misiones','tetrilogic','tetrilogic-v2-3');
INSERT INTO activities (id_activity,id_lesson,name) VALUES ('custom-teacher','les-c002-r1','Actividad personal');
""")
        self.sql("qa_edited", migration)
        self.sql("qa_edited", followup)
        self.equal("qa_edited", "SELECT count(*) FROM activities;", 31, "Edited installation gains missing activities without duplicating custom content")
        self.equal("qa_edited", "SELECT name||'|'||description||'|'||display_order||'|'||level_template FROM activities WHERE id_activity='act-c002-1';", "Mi reto editado|Texto docente|42|tetrilogic-1", "Edited activity remains unchanged")
        self.equal("qa_edited", "SELECT level_template FROM activities WHERE id_activity='act-c002-2';", "tetrilogic-2", "Edited mission prevents automatic template reassignment")
        self.equal("qa_edited", "SELECT objective||'|'||max_blocks FROM activity_missions WHERE id_mission='original-mission-2';", "Misión docente|9", "Edited mission remains unchanged")
        self.equal("qa_edited", "SELECT count(*) FROM activity_missions WHERE id_activity='act-c002-3';", 0, "No mission added to an existing teacher activity")
        self.equal("qa_edited", "SELECT name FROM activities WHERE id_activity='custom-teacher';", "Actividad personal", "Custom activity preserved")
        self.equal("qa_edited", "SELECT count(*) FROM activities WHERE id_activity NOT IN ('act-c002-1','act-c002-2','act-c002-3','custom-teacher');", 27, "Exactly twenty-seven missing activities inserted in the edited fixture")

        self.database("qa_rollback")
        self.original_course("qa_rollback")
        self.sql("qa_rollback", migration + "\nSELECT 1/0;", expected_failure=True)
        self.equal("qa_rollback", "SELECT to_regclass('public.tetrilogic_templates') IS NULL;", "t", "Failed migration rolls back the new table")
        self.equal("qa_rollback", "SELECT count(*) FROM activities;", 2, "Failed migration rolls back all inserted activities")
        self.equal("qa_rollback", "SELECT level_template FROM activities WHERE id_activity='act-c002-1';", "tetrilogic-1", "Failed migration rolls back prototype updates")
        self.equal("qa_rollback", "SELECT count(*) FROM activity_missions;", 2, "Failed migration rolls back mission inserts and updates")
        self.sql("qa_rollback", migration)
        self.sql("qa_rollback", followup)
        self.equal("qa_rollback", "SELECT count(*) FROM activities;", 30, "Clean retry after rollback completes once")

        # Real pre-V13 seed activities receive a NULL description column, not a
        # backfilled copy of their mission. V15 handles only otherwise exact seeds.
        self.database("qa_historical_null")
        self.original_course("qa_historical_null")
        self.sql("qa_historical_null", "UPDATE activities SET description=NULL;")
        self.sql("qa_historical_null", migration)
        self.equal("qa_historical_null", "SELECT count(*) FROM activities a JOIN tetrilogic_templates t ON a.level_template=t.template_id;", 28, "V14 conservatively retains historical NULL-description prototypes")
        self.sql("qa_historical_null", followup + "\nSELECT 1/0;", expected_failure=True)
        self.equal("qa_historical_null", "SELECT level_template FROM activities WHERE id_activity='act-c002-1';", "tetrilogic-1", "Failed V15 rolls back template reassignment")
        self.equal("qa_historical_null", "SELECT title FROM activity_missions WHERE id_mission='original-mission-1';", "Cubre el tablero 4x4", "Failed V15 rolls back mission update")
        self.equal("qa_historical_null", "SELECT count(*) FROM activities WHERE id_activity IN ('act-c002-1','act-c002-2') AND description IS NULL;", 2, "Failed V15 preserves both NULL descriptions")
        self.sql("qa_historical_null", followup)
        self.equal("qa_historical_null", "SELECT count(*) FROM activities a JOIN tetrilogic_templates t ON a.level_template=t.template_id;", 30, "V15 connects all thirty unedited historical activities")
        self.equal("qa_historical_null", "SELECT level_template FROM activities WHERE id_activity='act-c002-1';", "tetrilogic-v2-1", "Historical NULL-description prototype one upgrades")
        self.equal("qa_historical_null", "SELECT level_template FROM activities WHERE id_activity='act-c002-2';", "tetrilogic-v2-2", "Historical NULL-description prototype two upgrades")
        self.equal("qa_historical_null", "SELECT count(*) FROM activities WHERE id_activity IN ('act-c002-1','act-c002-2') AND description IS NOT NULL;", 2, "Historical prototypes receive their reviewed descriptions")
        self.equal("qa_historical_null", "SELECT title FROM activity_missions WHERE id_mission='original-mission-1';", "Primer encuentro", "Historical mission retains ID after V15")
        self.equal("qa_historical_null", "SELECT id_activity||'|'||score FROM activity_results WHERE id_result='historical-result';", "act-c002-2|73.00", "Historical result survives V15 unchanged")
        self.equal("qa_historical_null", "SELECT count(*) FROM activity_missions;", 30, "Historical NULL upgrade inserts no duplicate missions")

        self.database("qa_edited_null")
        self.original_course("qa_edited_null")
        self.sql("qa_edited_null", """
UPDATE activities SET description=NULL;
UPDATE activities SET start_x=1 WHERE id_activity='act-c002-1';
UPDATE activity_missions SET objective='Misión docente',max_blocks=9 WHERE id_activity='act-c002-2';
""")
        self.sql("qa_edited_null", migration)
        self.sql("qa_edited_null", followup)
        self.equal("qa_edited_null", "SELECT level_template||'|'||start_x::text FROM activities WHERE id_activity='act-c002-1';", "tetrilogic-1|1", "V15 preserves a coordinate edit even with NULL description")
        self.equal("qa_edited_null", "SELECT level_template FROM activities WHERE id_activity='act-c002-2';", "tetrilogic-2", "V15 preserves a mission edit even with NULL description")
        self.equal("qa_edited_null", "SELECT objective||'|'||max_blocks FROM activity_missions WHERE id_mission='original-mission-2';", "Misión docente|9", "V15 leaves edited mission content intact")
        self.equal("qa_edited_null", "SELECT count(*) FROM activities WHERE id_activity IN ('act-c002-1','act-c002-2') AND description IS NULL;", 2, "V15 does not fill descriptions on edited prototypes")
        self.equal("qa_edited_null", "SELECT count(*) FROM activities;", 30, "V15 changes no activity count")
        # Bare SQL is intentionally not replayed: Flyway owns version idempotence.
        # Its restart/no-new-migration behavior is also checked on the real application.
        return dict(postgresql=version, checks=len(self.checks), passed=self.checks,
                    migrations_through=15,
                    databases=["qa_fresh", "qa_original", "qa_edited", "qa_rollback", "qa_historical_null", "qa_edited_null"],
                    network="none", published_ports=[], temporary_storage=True)


if __name__ == "__main__":
    verification = Verification()
    try:
        result = verification.run()
    finally:
        verification.close()
    result["temporary_container_removed"] = True
    print(json.dumps(result, ensure_ascii=False, indent=2))
