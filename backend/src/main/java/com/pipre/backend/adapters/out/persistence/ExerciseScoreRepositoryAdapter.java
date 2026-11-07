package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.application.dto.GameScoreDTO;
import com.pipre.backend.application.ports.output.ExerciseScoreRepositoryPort;
import com.pipre.backend.domain.entities.game.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.time.*;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ExerciseScoreRepositoryAdapter implements ExerciseScoreRepositoryPort {
    private final JdbcTemplate jdbc;
    public Optional<GameScoreDTO> receipt(String id) {
        return jdbc.query("SELECT * FROM game_score_receipts WHERE session_id=?",(rs,row)->new GameScoreDTO(
            rs.getInt("points"),rs.getInt("best_points"),rs.getInt("points_gained"),rs.getLong("total_points"),rs.getInt("daily_xp_awarded"),rs.getString("score_version")),id).stream().findFirst();
    }
    public int best(String student,String key) {
        return jdbc.queryForList("SELECT best_points FROM game_best_scores WHERE student_id=? AND exercise_key=?",Integer.class,student,key).stream().findFirst().orElse(0);
    }
    public void improve(GameSession session,String key,int points) {
        // The caller holds the student's row lock, shared with completion and achievement evaluation.
        int count=jdbc.update("UPDATE game_best_scores SET best_points=?,session_id=?,updated_at=? WHERE student_id=? AND exercise_key=? AND best_points<?",
            points,session.sessionId(),session.completedAt().atOffset(ZoneOffset.UTC),session.studentId(),key,points);
        if(count==0&&best(session.studentId(),key)==0)jdbc.update("INSERT INTO game_best_scores(student_id,exercise_key,game,level_template,daily_challenge_id,best_points,session_id,updated_at) VALUES (?,?,?,?,?,?,?,?)",
            session.studentId(),key,session.game(),session.levelTemplate(),session.dailyChallengeId(),points,session.sessionId(),session.completedAt().atOffset(ZoneOffset.UTC));
    }
    public long total(String student) {return jdbc.queryForObject("SELECT COALESCE(SUM(best_points),0) FROM game_best_scores WHERE student_id=?",Long.class,student);}
    public int creditDailyXp(GameSession session,LocalDate date) {
        if(jdbc.queryForObject("SELECT COUNT(*) FROM daily_xp_ledger WHERE student_id=? AND local_date=?",Integer.class,session.studentId(),date)>0)return 0;
        jdbc.update("INSERT INTO daily_xp_ledger(student_id,local_date,session_id,amount,awarded_at) VALUES (?,?,?,?,?)",
            session.studentId(),date,session.sessionId(),ExercisePointsRules.DAILY_XP,session.completedAt().atOffset(ZoneOffset.UTC));
        jdbc.update("UPDATE gamification_accounts SET earned_xp=LEAST(2147483647,CAST(earned_xp AS BIGINT)+?) WHERE student_id=?",ExercisePointsRules.DAILY_XP,session.studentId());
        return ExercisePointsRules.DAILY_XP;
    }
    public void saveReceipt(GameSession session,GameScoreDTO score,long duration,int moves,int reference) {
        jdbc.update("INSERT INTO game_score_receipts(session_id,points,best_points,points_gained,total_points,daily_xp_awarded,duration_ms,moves,reference_moves,score_version) VALUES (?,?,?,?,?,?,?,?,?,?)",
            session.sessionId(),score.points(),score.bestPoints(),score.pointsGained(),score.totalPoints(),score.dailyXpAwarded(),duration,moves,reference,score.version());
    }
}
