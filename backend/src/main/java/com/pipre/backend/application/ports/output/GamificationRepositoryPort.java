package com.pipre.backend.application.ports.output;

import com.pipre.backend.application.commands.VerifiedVictory;
import com.pipre.backend.application.dto.StudentHistoryDTO;
import com.pipre.backend.domain.entities.gamification.Achievement;
import com.pipre.backend.domain.entities.gamification.AchievementRules.LevelProgress;
import com.pipre.backend.domain.entities.gamification.AchievementRules.SpeedStart;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

public interface GamificationRepositoryPort {
    record Daily(LocalDate date,String game,int levelNumber,String levelTemplate) {}
    record Unlock(String achievementId, String unlockedAt, Instant verifiedAt) {}
    record Account(int xpTotal,int level,BigDecimal totalPoints,int position) {}
    record ProfileMetrics(Long totalPiecesInVictories,Double movementEfficiencyPercent) {}
    default ProfileMetrics profileMetrics(String studentId){return new ProfileMetrics(null,null);}
    default int rankingPosition(String studentId){return 0;}
    void lockStudent(String studentId);
    boolean recordVictory(VerifiedVictory victory);
    void improveProgress(VerifiedVictory victory);
    List<LevelProgress> progress(String studentId);
    List<VerifiedVictory> recentVictories(String studentId);
    List<SpeedStart> sessionStarts(String studentId,long firstOrder,Instant completedAt);
    Daily daily(LocalDate date);
    void completeDaily(String studentId,LocalDate date,String sessionId,Instant completedAt);
    List<LocalDate> dailyDates(String studentId);
    List<Unlock> unlocks(String studentId);
    boolean unlock(String studentId,Achievement achievement,String sessionId,Instant at);
    void syncMembershipStats(String studentId,int currentStreak,int bestStreak);
    Account account(String studentId);
    List<StudentHistoryDTO> history(String studentId);
}
