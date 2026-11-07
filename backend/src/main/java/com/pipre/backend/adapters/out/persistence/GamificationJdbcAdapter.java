package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.application.commands.VerifiedVictory;
import com.pipre.backend.application.dto.StudentHistoryDTO;
import com.pipre.backend.application.ports.output.GamificationRepositoryPort;
import com.pipre.backend.domain.entities.gamification.Achievement;
import com.pipre.backend.domain.entities.gamification.AchievementRules.LevelProgress;
import com.pipre.backend.domain.entities.gamification.AchievementRules.SpeedStart;
import com.pipre.backend.domain.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.*;
import java.util.*;

@Component
@RequiredArgsConstructor
public class GamificationJdbcAdapter implements GamificationRepositoryPort {
    private final JdbcTemplate jdbc;
    private final com.fasterxml.jackson.databind.ObjectMapper json;
    private static OffsetDateTime utc(Instant value) { return value.atOffset(ZoneOffset.UTC); }
    private static Instant instant(ResultSet rs,String column) throws SQLException { return rs.getObject(column,OffsetDateTime.class).toInstant(); }

    @Override public void lockStudent(String studentId) {
        if(jdbc.query("SELECT id_user FROM users WHERE id_user=? FOR UPDATE",(rs,n)->rs.getString(1),studentId).isEmpty())
            throw new BusinessException("El estudiante no existe.");
        ensureAccount(studentId);
    }
    private void ensureAccount(String studentId) {
        jdbc.update("""
            INSERT INTO gamification_accounts(student_id,legacy_xp,legacy_level)
            SELECT u.id_user,GREATEST(COALESCE(MAX(gs.xp_total),0),0),GREATEST(COALESCE(MAX(gs.level),1),1)
            FROM users u LEFT JOIN group_students gs ON gs.id_student=u.id_user WHERE u.id_user=? GROUP BY u.id_user
            ON CONFLICT DO NOTHING
            """,studentId);
    }
    @Override public boolean recordVictory(VerifiedVictory v) {
        return jdbc.update("""
            INSERT INTO verified_game_victories(session_id,student_id,game,level_number,level_template,activity_id,
                started_at,completed_at,stars,daily_challenge_id,started_order) VALUES(?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT DO NOTHING
            """,v.sessionId(),v.studentId(),v.game(),v.levelNumber(),v.levelTemplate(),v.activityId(),utc(v.startedAt()),utc(v.completedAt()),v.stars(),v.dailyChallengeId(),v.startedOrder())==1;
    }
    @Override public void improveProgress(VerifiedVictory v) {
        // The caller holds the student lock for the entire victory transaction.
        // UPDATE then INSERT is portable and preserves the same unique-key protection.
        int changed=jdbc.update("""
            UPDATE game_level_progress SET best_stars=GREATEST(best_stars,?),
                first_completed_at=LEAST(first_completed_at,?),last_completed_at=GREATEST(last_completed_at,?)
            WHERE student_id=? AND game=? AND level_number=?
            """,v.stars(),utc(v.completedAt()),utc(v.completedAt()),v.studentId(),v.game(),v.levelNumber());
        if(changed==0) jdbc.update("""
            INSERT INTO game_level_progress(student_id,game,level_number,best_stars,first_completed_at,last_completed_at)
            VALUES(?,?,?,?,?,?)
            """,v.studentId(),v.game(),v.levelNumber(),v.stars(),utc(v.completedAt()),utc(v.completedAt()));
    }
    @Override public List<LevelProgress> progress(String id) {
        return jdbc.query("SELECT * FROM game_level_progress WHERE student_id=? ORDER BY game,level_number",
                (rs,n)->new LevelProgress(rs.getString("game"),rs.getInt("level_number"),rs.getInt("best_stars"),instant(rs,"first_completed_at"),instant(rs,"last_completed_at")),id);
    }
    @Override public List<VerifiedVictory> recentVictories(String id) {
        return jdbc.query("SELECT * FROM (SELECT * FROM verified_game_victories WHERE student_id=? ORDER BY victory_order DESC LIMIT 3) v ORDER BY victory_order",
                (rs,n)->new VerifiedVictory(rs.getString("student_id"),rs.getString("session_id"),rs.getString("game"),rs.getInt("level_number"),rs.getString("level_template"),rs.getString("activity_id"),instant(rs,"started_at"),instant(rs,"completed_at"),rs.getInt("stars"),rs.getString("daily_challenge_id"),rs.getLong("started_order")),id);
    }
    @Override public List<SpeedStart> sessionStarts(String id,long firstOrder,Instant completedAt) {
        return jdbc.query("SELECT session_id,game,level_number,started_order FROM game_sessions WHERE student_id=? AND started_order>=? AND started_at<=? ORDER BY started_order",
                (rs,n)->new SpeedStart(rs.getString("session_id"),rs.getString("game"),rs.getInt("level_number"),rs.getLong("started_order")),id,firstOrder,utc(completedAt));
    }
    @Override public Daily daily(LocalDate date) {
        int index=Math.floorMod(date.toEpochDay(),60);
        String game=index<30?"neonflow":"tetrilogic"; int number=index%30+1;
        jdbc.update("INSERT INTO daily_challenges(local_date,game,level_number,level_template) VALUES(?,?,?,?) ON CONFLICT DO NOTHING",
                date,game,number,game+"-v2-"+number);
        return jdbc.queryForObject("SELECT * FROM daily_challenges WHERE local_date=?",
                (rs,n)->new Daily(rs.getObject("local_date",LocalDate.class),rs.getString("game"),rs.getInt("level_number"),rs.getString("level_template")),date);
    }
    @Override public void completeDaily(String studentId,LocalDate date,String sessionId,Instant at) {
        jdbc.update("INSERT INTO daily_challenge_completions(student_id,local_date,session_id,completed_at) VALUES(?,?,?,?) ON CONFLICT DO NOTHING",studentId,date,sessionId,utc(at));
    }
    @Override public List<LocalDate> dailyDates(String id) {
        return jdbc.query("SELECT local_date FROM daily_challenge_completions WHERE student_id=? ORDER BY local_date",(rs,n)->rs.getObject(1,LocalDate.class),id);
    }
    @Override public List<Unlock> unlocks(String id) {
        return jdbc.query("SELECT id_achievement,unlocked_at,unlocked_at_verified FROM player_achievements WHERE id_student=?",(rs,n)->{
            var verified=rs.getObject("unlocked_at_verified",OffsetDateTime.class);
            var legacy=rs.getObject("unlocked_at",LocalDateTime.class);
            return new Unlock(rs.getString("id_achievement"),verified!=null?verified.toInstant().toString():legacy==null?null:legacy.toString(),verified==null?null:verified.toInstant());
        },id);
    }
    @Override public boolean unlock(String id,Achievement a,String sessionId,Instant at) {
        String awardId=UUID.randomUUID().toString();
        int inserted=jdbc.update("""
            INSERT INTO player_achievements(id_player_achievement,id_student,id_achievement,unlocked_at,unlocked_at_verified)
            VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING
            """,awardId,id,a.getIdAchievement(),LocalDateTime.ofInstant(at,ZoneOffset.UTC),utc(at));
        if(inserted==0) return false;
        jdbc.update("INSERT INTO achievement_xp_ledger(player_achievement_id,student_id,session_id,amount,awarded_at) VALUES(?,?,?,?,?)",awardId,id,sessionId,a.getXpReward(),utc(at));
        jdbc.update("UPDATE gamification_accounts SET earned_xp=earned_xp+? WHERE student_id=?",a.getXpReward(),id);
        return true;
    }
    @Override public void syncMembershipStats(String id,int current,int best) {
        // Legacy membership aggregates remain unchanged. Read-side overlays expose new global progress.
    }
    @Override public Account account(String id) {
        return jdbc.queryForObject("""
            SELECT LEAST(2147483647,COALESCE(CAST(a.legacy_xp AS BIGINT)+a.earned_xp,GREATEST(COALESCE(MAX(gs.xp_total),0),0))) xp,
            COALESCE(a.legacy_level,GREATEST(COALESCE(MAX(gs.level),1),1)) legacy_level,
            (SELECT COALESCE(SUM(s.best_points),0) FROM game_best_scores s WHERE s.student_id=u.id_user) points,0 position
            FROM users u LEFT JOIN gamification_accounts a ON a.student_id=u.id_user
            LEFT JOIN group_students gs ON gs.id_student=u.id_user WHERE u.id_user=?
            GROUP BY u.id_user,a.legacy_xp,a.earned_xp,a.legacy_level
            """,(rs,n)->new Account(rs.getInt("xp"),Math.max(rs.getInt("legacy_level"),1+rs.getInt("xp")/500),rs.getBigDecimal("points"),rs.getInt("position")),id);
    }
    @Override public ProfileMetrics profileMetrics(String id) {
        var states=jdbc.queryForList("SELECT gs.state FROM game_sessions gs JOIN game_score_receipts r ON r.session_id=gs.session_id WHERE gs.student_id=? AND gs.status='COMPLETED'",String.class,id);
        if(states.isEmpty())return new ProfileMetrics(null,null);
        long pieces=0;for(String state:states)try{pieces+=json.readTree(state).path("pieces").size();}catch(com.fasterxml.jackson.core.JsonProcessingException invalid){throw new IllegalStateException("Estado verificado inválido.",invalid);}
        Double efficiency=jdbc.queryForObject("SELECT AVG(100.0*reference_moves/GREATEST(reference_moves,moves)) FROM game_score_receipts r JOIN game_sessions gs ON gs.session_id=r.session_id WHERE gs.student_id=?",Double.class,id);
        return new ProfileMetrics(pieces,efficiency);
    }
    @Override public int rankingPosition(String id) {
        String visibility=jdbc.queryForObject("SELECT student_visibility FROM ranking_settings WHERE setting_id=1",String.class);
        if("HIDDEN".equals(visibility))return 0;
        String total="COALESCE(s.points,0)",base=" FROM users u LEFT JOIN (SELECT student_id,SUM(best_points) points FROM game_best_scores GROUP BY student_id) s ON s.student_id=u.id_user ";
        String ranked="GLOBAL".equals(visibility)?"SELECT u.id_user,ROW_NUMBER() OVER(ORDER BY "+total+" DESC,u.id_user) position"+base+"WHERE "+VerifiedRankingRepositoryAdapter.STUDENTS
            :"SELECT u.id_user,ROW_NUMBER() OVER(PARTITION BY gs.id_group ORDER BY "+total+" DESC,u.id_user) position"+base+"JOIN group_students gs ON gs.id_student=u.id_user WHERE "+VerifiedRankingRepositoryAdapter.STUDENTS;
        Integer position=jdbc.queryForObject("SELECT MIN(position) FROM ("+ranked+") ranked WHERE id_user=?",Integer.class,id);
        return position==null?0:position;
    }
    @Override public List<StudentHistoryDTO> history(String id) {
        var result=new ArrayList<>(jdbc.query("""
            SELECT v.*,s.points verified_points,COALESCE((SELECT SUM(amount) FROM achievement_xp_ledger l WHERE l.session_id=v.session_id),0)+COALESCE((SELECT SUM(amount) FROM daily_xp_ledger d WHERE d.session_id=v.session_id),0) xp
            FROM verified_game_victories v LEFT JOIN game_score_receipts s ON s.session_id=v.session_id WHERE v.student_id=? ORDER BY victory_order DESC
            """,(rs,n)->new StudentHistoryDTO(rs.getString("session_id"),rs.getString("activity_id"),
                (rs.getString("game").equals("neonflow")?"Neon Flow":"TetriLogic")+" · Nivel "+rs.getInt("level_number"),
                rs.getBigDecimal("verified_points"),rs.getInt("stars"),rs.getInt("xp"),null,instant(rs,"completed_at").toString(),"SERVER_VERIFIED"),id));
        result.addAll(jdbc.query("""
            SELECT r.*,a.name activity_name FROM activity_results r LEFT JOIN activities a ON a.id_activity=r.id_activity
            WHERE r.id_student=? ORDER BY r.date_attempted DESC
            """,(rs,n)->new StudentHistoryDTO(rs.getString("id_result"),rs.getString("id_activity"),
                rs.getString("activity_name"),rs.getBigDecimal("score"),(Integer)rs.getObject("stars"),(Integer)rs.getObject("xp_earned"),
                rs.getBigDecimal("efficiency")==null?null:rs.getBigDecimal("efficiency").doubleValue(),
                rs.getObject("date_attempted",LocalDateTime.class)==null?null:rs.getObject("date_attempted",LocalDateTime.class).toString()),id));
        return result;
    }
}
