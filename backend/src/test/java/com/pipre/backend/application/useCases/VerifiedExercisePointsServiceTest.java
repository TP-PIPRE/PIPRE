package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.dto.GameScoreDTO;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.game.*;
import org.junit.jupiter.api.*;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class VerifiedExercisePointsServiceTest {
    final ObjectMapper json=new ObjectMapper();
    final ExerciseScoreRepositoryPort scores=mock(ExerciseScoreRepositoryPort.class);
    final GamificationRepositoryPort accounts=mock(GamificationRepositoryPort.class);
    final ProceduralDailyService daily=mock(ProceduralDailyService.class);
    final GameReferenceMoves references=mock(GameReferenceMoves.class);
    final VerifiedExercisePointsService service=new VerifiedExercisePointsService(scores,accounts,daily,references);
    @BeforeEach void setup() {when(references.forTemplate("neonflow-v2-1")).thenReturn(4);when(accounts.dailyDates("s")).thenReturn(List.of());}
    GameSession session(String dailyId) {
        var state=BoardRules.initialState();state.put("moves",4);var started=Instant.parse("2026-11-06T12:00:00Z");
        return new GameSession("session","client","s","neonflow",1,"neonflow-v2-1",null,dailyId,started,started.plusSeconds(180),"COMPLETED",state,4,1,3,null);
    }
    GameScoreDTO award(GameSession session) {return service.award(session,json.createObjectNode().put("templateId","neonflow-v2-1"));}
    @Test void firstVerifiedResultRecordsOnlyItsOwnPoints() {
        when(scores.total("s")).thenReturn(90L);var score=award(session(null));assertEquals(90,score.points());assertEquals(90,score.pointsGained());assertEquals(90,score.totalPoints());
        verify(scores).improve(any(),eq("official:neonflow-v2-1"),eq(90));verify(scores,never()).creditDailyXp(any(),any());
    }
    @Test void aWorseReplayDoesNotReduceOrAddPoints() {
        when(scores.best("s","official:neonflow-v2-1")).thenReturn(98);var score=award(session(null));assertEquals(98,score.bestPoints());assertEquals(0,score.pointsGained());verify(scores,never()).improve(any(),any(),anyInt());
    }
    @Test void anImprovementAwardsOnlyTheDifference() {
        when(scores.best("s","official:neonflow-v2-1")).thenReturn(70);assertEquals(20,award(session(null)).pointsGained());
    }
    @Test void aStoredReceiptIsReturnedWithoutDuplicateWrites() {
        var receipt=new GameScoreDTO(90,90,90,90,0,"verified-points-v1");when(scores.receipt("session")).thenReturn(Optional.of(receipt));assertSame(receipt,award(session(null)));verify(scores,never()).improve(any(),any(),anyInt());verify(scores,never()).saveReceipt(any(),any(),anyLong(),anyInt(),anyInt());
    }
    @Test void dailyXpRequiresAllFiveExercises() {
        var value=session(UUID.randomUUID().toString());when(daily.completed(eq("s"),any())).thenReturn(Optional.of(false));assertEquals(0,award(value).dailyXpAwarded());verify(scores,never()).creditDailyXp(any(),any());
    }
    @Test void completedDailyUsesTheIdempotentDateLedger() {
        var value=session(UUID.randomUUID().toString());when(daily.completed(eq("s"),any())).thenReturn(Optional.of(true));when(scores.creditDailyXp(eq(value),any())).thenReturn(50);assertEquals(50,award(value).dailyXpAwarded());verify(scores).improve(eq(value),eq("daily:"+value.dailyChallengeId()),eq(90));
    }
    @Test void activeSessionsCannotGrantPoints() {var value=session(null);assertThrows(IllegalArgumentException.class,()->award(value.change(value.state(),value.revision(),"ACTIVE",null,null,null)));verifyNoInteractions(scores);}
    @Test void rejectsAMismatchedConfiguration() {assertThrows(IllegalArgumentException.class,()->service.award(session(null),json.createObjectNode().put("templateId","neonflow-v2-2")));verify(scores,never()).improve(any(),any(),anyInt());}
}
