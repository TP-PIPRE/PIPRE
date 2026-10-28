package com.pipre.backend.infrastructure.util.seed;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

/** Uses actual Flyway scripts and FK constraints, never a substitute in-memory catalog. */
class TetriLogicCatalogMigrationTest {
    private static final String LESSON = "les-c002-r1";
    private static final String OBJECTIVE_1 = "Encaja los Tetriminos para cubrir el tablero cumpliendo el conteo de celdas por fila y columna.";
    private static final String OBJECTIVE_2 = "Encaja los Tetriminos respetando las celdas bloqueadas de la fila inferior del tablero.";

    private String database() {
        return "jdbc:h2:mem:catalog_" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1;MODE=PostgreSQL";
    }
    private Flyway migrate(String url, String target) {
        var flyway = Flyway.configure().dataSource(url, "sa", "").locations("classpath:db/migration").target(target).load();
        flyway.migrate();
        return flyway;
    }
    private void execute(Connection c, String sql) throws Exception {
        try (var statement = c.createStatement()) { statement.execute(sql); }
    }
    private String scalar(Connection c, String sql) throws Exception {
        try (var statement = c.createStatement(); var result = statement.executeQuery(sql)) {
            assertTrue(result.next());
            return result.getString(1);
        }
    }
    private void existingCourse(Connection c) throws Exception {
        execute(c, "INSERT INTO courses (id_course,name,description) VALUES ('c002','Curso editado','Descripción docente')");
        execute(c, "INSERT INTO modules (id_module,id_course,title) VALUES ('mod-c002-r1','c002','Módulo editado')");
        execute(c, "INSERT INTO lessons (id_lesson,id_module,title) VALUES ('" + LESSON + "','mod-c002-r1','Lección editada')");
    }
    private void prototype(Connection c, int n) throws Exception {
        String difficulty = n == 1 ? "EASY" : "MEDIUM";
        String logic = n == 1 ? "LOW" : "MEDIUM";
        String objective = n == 1 ? OBJECTIVE_1 : OBJECTIVE_2;
        String title = n == 1 ? "Cubre el tablero 4x4" : "Esquiva las celdas bloqueadas";
        try (var statement = c.prepareStatement("INSERT INTO activities (id_activity,id_lesson,name,logic_level,complexity,difficulty,type,environment,description,level_template,display_order,start_x,start_z,target_x,target_z) VALUES (?,?,?,?,?,?,'robotics','tetrilogic',?,?,?,0,0,0,0)")) {
            statement.setString(1, "act-c002-" + n);
            statement.setString(2, LESSON);
            statement.setString(3, "TetriLogic - Nivel " + n);
            statement.setString(4, logic);
            statement.setString(5, difficulty);
            statement.setString(6, difficulty);
            statement.setString(7, objective);
            statement.setString(8, "tetrilogic-" + n);
            statement.setInt(9, n);
            statement.executeUpdate();
        }
        try (var statement = c.prepareStatement("INSERT INTO activity_missions VALUES (?,?,?,?,0)")) {
            statement.setString(1, "original-mission-" + n);
            statement.setString(2, "act-c002-" + n);
            statement.setString(3, title);
            statement.setString(4, objective);
            statement.executeUpdate();
        }
    }

    @Test void emptyInstallGetsThirtyCompleteBoardsAndDoesNotDuplicateOnRestart() throws Exception {
        String url = database();
        var flyway = migrate(url, "latest");
        try (var c = DriverManager.getConnection(url, "sa", "")) {
            assertEquals("30", scalar(c, "SELECT count(*) FROM tetrilogic_templates"));
            assertEquals("30", scalar(c, "SELECT count(*) FROM activities WHERE id_lesson='" + LESSON + "'"));
            assertEquals("30", scalar(c, "SELECT count(*) FROM activity_missions"));
            assertEquals("30", scalar(c, "SELECT count(*) FROM activities a JOIN tetrilogic_templates t ON t.template_id=a.level_template"));
            assertEquals("30", scalar(c, "SELECT count(DISTINCT display_order) FROM activities"));
            var parsed = new ObjectMapper().readTree(scalar(c, "SELECT config FROM tetrilogic_templates WHERE template_id='tetrilogic-v2-30'"));
            assertTrue(parsed.isObject(), "Config must be a JSON object, not an encoded JSON string");
            assertEquals(30, parsed.get("level").asInt());
            assertEquals(6, parsed.get("boardSize").get("rows").asInt());
            assertFalse(parsed.has("placements"));
            assertEquals(0, flyway.migrate().migrationsExecuted);
            assertEquals("30", scalar(c, "SELECT count(*) FROM activities"));
        }
    }

    @Test void existingOriginalPrototypesUpgradeWithoutChangingIdentityOrCourseEdits() throws Exception {
        String url = database();
        migrate(url, "13");
        try (var c = DriverManager.getConnection(url, "sa", "")) {
            existingCourse(c);
            prototype(c, 1);
            prototype(c, 2);
        }
        migrate(url, "latest");
        try (var c = DriverManager.getConnection(url, "sa", "")) {
            assertEquals("30", scalar(c, "SELECT count(*) FROM activities"));
            assertEquals("tetrilogic-v2-1", scalar(c, "SELECT level_template FROM activities WHERE id_activity='act-c002-1'"));
            assertEquals("tetrilogic-v2-2", scalar(c, "SELECT level_template FROM activities WHERE id_activity='act-c002-2'"));
            assertEquals("Primer encuentro", scalar(c, "SELECT title FROM activity_missions WHERE id_mission='original-mission-1'"));
            assertEquals("Giro de perspectiva", scalar(c, "SELECT title FROM activity_missions WHERE id_mission='original-mission-2'"));
            assertEquals("Curso editado", scalar(c, "SELECT name FROM courses WHERE id_course='c002'"));
            assertEquals("Descripción docente", scalar(c, "SELECT description FROM courses WHERE id_course='c002'"));
            assertEquals("Módulo editado", scalar(c, "SELECT title FROM modules WHERE id_module='mod-c002-r1'"));
            assertEquals("Lección editada", scalar(c, "SELECT title FROM lessons WHERE id_lesson='" + LESSON + "'"));
        }
    }

    @Test void historicalNullDescriptionsUpgradeOnlyAfterTheCompatibleFollowupMigration() throws Exception {
        String url = database();
        migrate(url, "13");
        try (var c = DriverManager.getConnection(url, "sa", "")) {
            existingCourse(c);
            prototype(c, 1);
            prototype(c, 2);
            execute(c, "UPDATE activities SET description=NULL");
            execute(c, "INSERT INTO simulations (id_simulation,id_activity,result) VALUES ('historical-simulation','act-c002-1','SUCCESS')");
            execute(c, "INSERT INTO activity_results (id_result,id_activity,score) VALUES ('historical-result','act-c002-2',73)");
        }
        migrate(url, "14");
        try (var c = DriverManager.getConnection(url, "sa", "")) {
            assertEquals("tetrilogic-1", scalar(c, "SELECT level_template FROM activities WHERE id_activity='act-c002-1'"));
            assertEquals("tetrilogic-2", scalar(c, "SELECT level_template FROM activities WHERE id_activity='act-c002-2'"));
        }
        var flyway = migrate(url, "latest");
        try (var c = DriverManager.getConnection(url, "sa", "")) {
            assertEquals("30", scalar(c, "SELECT count(*) FROM activities"));
            assertEquals("30", scalar(c, "SELECT count(*) FROM activities a JOIN tetrilogic_templates t ON t.template_id=a.level_template"));
            assertEquals("tetrilogic-v2-1", scalar(c, "SELECT level_template FROM activities WHERE id_activity='act-c002-1'"));
            assertEquals("tetrilogic-v2-2", scalar(c, "SELECT level_template FROM activities WHERE id_activity='act-c002-2'"));
            assertTrue(scalar(c, "SELECT description FROM activities WHERE id_activity='act-c002-1'").startsWith("Coloca las 3 piezas"));
            assertEquals("Primer encuentro", scalar(c, "SELECT title FROM activity_missions WHERE id_mission='original-mission-1'"));
            assertEquals("Giro de perspectiva", scalar(c, "SELECT title FROM activity_missions WHERE id_mission='original-mission-2'"));
            assertEquals("act-c002-1", scalar(c, "SELECT id_activity FROM simulations WHERE id_simulation='historical-simulation'"));
            assertEquals("73.00", scalar(c, "SELECT score FROM activity_results WHERE id_result='historical-result'"));
            assertEquals("Curso editado", scalar(c, "SELECT name FROM courses WHERE id_course='c002'"));
            assertEquals(0, flyway.migrate().migrationsExecuted);
        }
    }

    @Test void nullDescriptionDoesNotOverrideOtherTeacherEdits() throws Exception {
        String url = database();
        migrate(url, "13");
        try (var c = DriverManager.getConnection(url, "sa", "")) {
            existingCourse(c);
            prototype(c, 1);
            prototype(c, 2);
            execute(c, "UPDATE activities SET description=NULL");
            execute(c, "UPDATE activities SET start_x=1 WHERE id_activity='act-c002-1'");
            execute(c, "UPDATE activity_missions SET objective='Misión docente',max_blocks=9 WHERE id_activity='act-c002-2'");
        }
        migrate(url, "latest");
        try (var c = DriverManager.getConnection(url, "sa", "")) {
            assertEquals("tetrilogic-1", scalar(c, "SELECT level_template FROM activities WHERE id_activity='act-c002-1'"));
            assertEquals("tetrilogic-2", scalar(c, "SELECT level_template FROM activities WHERE id_activity='act-c002-2'"));
            assertNull(scalar(c, "SELECT description FROM activities WHERE id_activity='act-c002-1'"));
            assertEquals("1.0", scalar(c, "SELECT start_x FROM activities WHERE id_activity='act-c002-1'"));
            assertEquals("Misión docente", scalar(c, "SELECT objective FROM activity_missions WHERE id_mission='original-mission-2'"));
            assertEquals("9", scalar(c, "SELECT max_blocks FROM activity_missions WHERE id_mission='original-mission-2'"));
            assertEquals("30", scalar(c, "SELECT count(*) FROM activities"));
        }
    }

    @Test void editedActivitiesAndMissionsRemainUntouchedWhileMissingLevelsAreAdded() throws Exception {
        String url = database();
        migrate(url, "13");
        try (var c = DriverManager.getConnection(url, "sa", "")) {
            existingCourse(c);
            prototype(c, 1);
            prototype(c, 2);
            execute(c, "UPDATE activities SET name='Mi reto editado',description='Texto docente',display_order=42 WHERE id_activity='act-c002-1'");
            execute(c, "UPDATE activity_missions SET objective='Misión docente',max_blocks=9 WHERE id_activity='act-c002-2'");
            execute(c, "INSERT INTO activities (id_activity,id_lesson,name,environment,level_template) VALUES ('act-c002-3','" + LESSON + "','Mi plantilla v2 sin misiones','tetrilogic','tetrilogic-v2-3')");
            execute(c, "INSERT INTO activities (id_activity,id_lesson,name) VALUES ('custom-teacher','" + LESSON + "','Actividad personal')");
        }
        migrate(url, "latest");
        try (var c = DriverManager.getConnection(url, "sa", "")) {
            assertEquals("31", scalar(c, "SELECT count(*) FROM activities"));
            assertEquals("Mi reto editado", scalar(c, "SELECT name FROM activities WHERE id_activity='act-c002-1'"));
            assertEquals("Texto docente", scalar(c, "SELECT description FROM activities WHERE id_activity='act-c002-1'"));
            assertEquals("42", scalar(c, "SELECT display_order FROM activities WHERE id_activity='act-c002-1'"));
            assertEquals("tetrilogic-1", scalar(c, "SELECT level_template FROM activities WHERE id_activity='act-c002-1'"));
            assertEquals("tetrilogic-2", scalar(c, "SELECT level_template FROM activities WHERE id_activity='act-c002-2'"));
            assertEquals("Misión docente", scalar(c, "SELECT objective FROM activity_missions WHERE id_mission='original-mission-2'"));
            assertEquals("9", scalar(c, "SELECT max_blocks FROM activity_missions WHERE id_mission='original-mission-2'"));
            assertEquals("0", scalar(c, "SELECT count(*) FROM activity_missions WHERE id_activity='act-c002-3'"));
            assertEquals("Actividad personal", scalar(c, "SELECT name FROM activities WHERE id_activity='custom-teacher'"));
            assertEquals("27", scalar(c, "SELECT count(*) FROM activities WHERE id_activity NOT IN ('act-c002-1','act-c002-2','act-c002-3','custom-teacher')"));
        }
    }
}
