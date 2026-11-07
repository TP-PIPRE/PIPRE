package com.pipre.backend.infrastructure;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class IntegrityMigrationTest {
    @Test void refusesHistoricalDuplicatesWithoutDeletingOrChoosingTheirScores() {
        var source=new DriverManagerDataSource("jdbc:h2:mem:duplicate-copy-"+UUID.randomUUID()+";DB_CLOSE_DELAY=-1;MODE=PostgreSQL","sa","");
        Flyway.configure().dataSource(source).placeholders(Map.of("telemetry_fk_validation","")).target("24").load().migrate();
        var jdbc=new JdbcTemplate(source);
        jdbc.update("INSERT INTO users(id_user,first_name,last_name,email,password_hash) VALUES ('u','QA','Duplicate','duplicate@test.invalid','fixture')");
        jdbc.update("INSERT INTO groups(id_group,group_name) VALUES ('g','QA copy')");
        jdbc.update("INSERT INTO group_students(id_ranking,id_group,id_student,total_points,xp_total) VALUES ('one','g','u',12,25),('two','g','u',30,50)");
        assertThrows(org.flywaydb.core.api.FlywayException.class,()->Flyway.configure().dataSource(source).placeholders(Map.of("telemetry_fk_validation","")).target("25").load().migrate());
        assertEquals(2,jdbc.queryForObject("SELECT COUNT(*) FROM group_students WHERE id_group='g'",Integer.class));
        assertEquals(List.of(25,50),jdbc.queryForList("SELECT xp_total FROM group_students WHERE id_group='g' ORDER BY xp_total",Integer.class));
        assertEquals(List.of(12,30),jdbc.queryForList("SELECT CAST(total_points AS INTEGER) FROM group_students WHERE id_group='g' ORDER BY total_points",Integer.class));
    }
}
