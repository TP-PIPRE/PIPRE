package com.pipre.backend.adapters.out.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.ports.output.DailySetRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.time.*;
import java.util.*;

@Component @RequiredArgsConstructor
public class DailySetJdbcAdapter implements DailySetRepositoryPort {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private Challenge row(java.sql.ResultSet r,int n) throws java.sql.SQLException {
        try {
            var at=r.getObject("completed_at",OffsetDateTime.class);
            return new Challenge(r.getString("id"),r.getString("student_id"),r.getObject("local_date",LocalDate.class),r.getInt("slot"),
                r.getString("game"),r.getInt("level_number"),r.getString("level_template"),r.getString("difficulty"),
                json.readTree(r.getString("config")),at==null?null:at.toInstant(),r.getInt("best_stars"),
                r.getObject("started_at",OffsetDateTime.class)==null?null:r.getObject("started_at",OffsetDateTime.class).toInstant());
        } catch(com.fasterxml.jackson.core.JsonProcessingException e) { throw new IllegalStateException("Invalid daily snapshot",e); }
    }
    public List<Challenge> find(String studentId,LocalDate date) { return jdbc.query("SELECT * FROM procedural_daily_challenges WHERE student_id=? AND local_date=? ORDER BY slot",this::row,studentId,date); }
    public Optional<Challenge> findById(String id) { return jdbc.query("SELECT * FROM procedural_daily_challenges WHERE id=?",this::row,id).stream().findFirst(); }
    public void save(String studentId,LocalDate date,List<Challenge> challenges) {
        jdbc.update("INSERT INTO procedural_daily_sets(student_id,local_date,generator_version) VALUES(?,?,?)",studentId,date,"daily-translation-v1");
        for(var c:challenges) jdbc.update("INSERT INTO procedural_daily_challenges(id,student_id,local_date,slot,game,level_number,level_template,difficulty,config) VALUES(?,?,?,?,?,?,?,?,?)",
            c.id(),studentId,date,c.slot(),c.game(),c.levelNumber(),c.levelTemplate(),c.difficulty(),c.config().toString());
    }
    public void complete(String id,String sessionId,Instant at,int stars) {
        jdbc.update("UPDATE procedural_daily_challenges SET completed_at=COALESCE(completed_at,?),session_id=COALESCE(session_id,?),best_stars=GREATEST(best_stars,?) WHERE id=?",at.atOffset(ZoneOffset.UTC),sessionId,stars,id);
    }
    public void start(String id,Instant at) {
        jdbc.update("UPDATE procedural_daily_challenges SET started_at=COALESCE(started_at,?) WHERE id=?",at.atOffset(ZoneOffset.UTC),id);
    }
}
