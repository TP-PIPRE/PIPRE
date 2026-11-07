package com.pipre.backend.adapters.out.persistence;
import com.pipre.backend.application.ports.output.RankingMetadataPort;
import com.pipre.backend.domain.entities.gamification.AchievementRules;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Repository
public class RankingMetadataAdapter implements RankingMetadataPort {
    private final NamedParameterJdbcTemplate jdbc;
    private final Clock clock;
    public RankingMetadataAdapter(JdbcTemplate jdbc,Clock clock){this.jdbc=new NamedParameterJdbcTemplate(jdbc);this.clock=clock;}
    @Transactional(readOnly=true) public Map<String,Metadata> load(Set<String> ids) {
        var result=new HashMap<String,Metadata>();var ordered=new ArrayList<>(ids);
        for(int offset=0;offset<ordered.size();offset+=500) {
            var parameters=Map.of("ids",ordered.subList(offset,Math.min(offset+500,ordered.size())));
            var stars=new HashMap<String,Integer>();
            jdbc.query("SELECT student_id,SUM(best_stars) stars FROM game_level_progress WHERE student_id IN (:ids) GROUP BY student_id",parameters,(org.springframework.jdbc.core.RowCallbackHandler)rs->stars.put(rs.getString(1),rs.getInt(2)));
            var dates=new HashMap<String,List<LocalDate>>();
            jdbc.query("SELECT student_id,local_date FROM daily_challenge_completions WHERE student_id IN (:ids) ORDER BY student_id,local_date",parameters,(org.springframework.jdbc.core.RowCallbackHandler)rs->dates.computeIfAbsent(rs.getString(1),id->new ArrayList<>()).add(rs.getObject(2,LocalDate.class)));
            LocalDate today=clock.instant().atZone(ZoneId.of("America/Lima")).toLocalDate();
            jdbc.query("""
                SELECT u.id_user,LEAST(2147483647,COALESCE(CAST(a.legacy_xp AS BIGINT)+a.earned_xp,GREATEST(COALESCE(MAX(gs.xp_total),0),0))) xp,
                COALESCE(a.legacy_level,GREATEST(COALESCE(MAX(gs.level),1),1)) level
                FROM users u LEFT JOIN gamification_accounts a ON a.student_id=u.id_user LEFT JOIN group_students gs ON gs.id_student=u.id_user
                WHERE u.id_user IN (:ids) GROUP BY u.id_user,a.legacy_xp,a.earned_xp,a.legacy_level
                """,parameters,(org.springframework.jdbc.core.RowCallbackHandler)rs->{String id=rs.getString(1);int xp=rs.getInt(2);var streak=AchievementRules.streak(dates.getOrDefault(id,List.of()),today);result.put(id,new Metadata(Math.max(rs.getInt(3),1+xp/500),xp,stars.getOrDefault(id,0),streak.current(),streak.best()));});
        }
        return Map.copyOf(result);
    }
}
