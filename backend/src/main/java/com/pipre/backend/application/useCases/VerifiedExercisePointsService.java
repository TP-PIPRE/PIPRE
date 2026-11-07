package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.JsonNode;
import com.pipre.backend.application.dto.GameScoreDTO;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.game.*;
import com.pipre.backend.domain.entities.gamification.AchievementRules;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;

@Service
@RequiredArgsConstructor
public class VerifiedExercisePointsService {
    private final ExerciseScoreRepositoryPort scores;
    private final GamificationRepositoryPort gamification;
    private final ProceduralDailyService daily;
    private final GameReferenceMoves references;
    @Transactional
    public GameScoreDTO award(GameSession session,JsonNode config) {
        if(!"COMPLETED".equals(session.status())||session.completedAt()==null)throw new IllegalArgumentException("Only verified victories may award points");
        gamification.lockStudent(session.studentId());
        var receipt=scores.receipt(session.sessionId());if(receipt.isPresent())return receipt.get();
        long duration=Duration.between(session.startedAt(),session.completedAt()).toMillis();
        if(!session.levelTemplate().equals(config.path("templateId").asText()))throw new IllegalArgumentException("Score configuration does not match the verified session");
        int moves=session.state().path("moves").asInt(-1),reference=references.forTemplate(session.levelTemplate());
        int points=ExercisePointsRules.points(moves,reference,duration);
        boolean generated=ProceduralDailyService.procedural(session.dailyChallengeId());
        String key=generated?"daily:"+session.dailyChallengeId():"official:"+session.levelTemplate();
        int previous=scores.best(session.studentId(),key);
        if(points>previous)scores.improve(session,key,points);
        int xp=0;LocalDate date=session.completedAt().atZone(GamificationService.DAILY_ZONE).toLocalDate();
        if(generated&&daily.completed(session.studentId(),date).orElse(false))xp=scores.creditDailyXp(session,date);
        var streak=AchievementRules.streak(gamification.dailyDates(session.studentId()),date);
        gamification.syncMembershipStats(session.studentId(),streak.current(),streak.best());
        var score=new GameScoreDTO(points,Math.max(previous,points),Math.max(0,points-previous),scores.total(session.studentId()),xp,ExercisePointsRules.VERSION);
        scores.saveReceipt(session,score,duration,moves,reference);return score;
    }
}
