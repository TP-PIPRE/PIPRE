package com.pipre.backend.unit;

import com.pipre.backend.application.commands.AddStudentRankingCommand;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.application.useCases.AddStudentRankingService;
import com.pipre.backend.domain.entities.ranking.Ranking;
import com.pipre.backend.domain.entities.result.Result;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.math.BigDecimal;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.argThat;

class RankingIdempotencyTest {
    @Test void repeatedAssignmentNeverResetsMembershipStats() {
        var rankings=mock(RankingRepositoryPort.class);var results=mock(ResultRepositoryPort.class);
        var row=Ranking.builder().idRanking("existing").idGroup("group").idStudent("student").xpTotal(500).totalStars(9).build();
        when(rankings.findAllByIdGroup("group")).thenReturn(List.of(row));
        new AddStudentRankingService(rankings,results).execute(new AddStudentRankingCommand("group","student"));
        verify(rankings).lockGroup("group");verify(rankings,never()).save(any());verifyNoInteractions(results);
    }
    @Test void unknownHistoricalScoresAreNotInventedAndDoNotCrashAggregation() {
        var rankings=mock(RankingRepositoryPort.class);var results=mock(ResultRepositoryPort.class);
        when(results.findByIdStudent("student")).thenReturn(List.of(Result.builder().idResult("old").idStudent("student").idActivity("activity").score(null).build(),Result.builder().idResult("scored").idStudent("student").idActivity("activity").score(BigDecimal.TEN).build()));
        new AddStudentRankingService(rankings,results).execute(new AddStudentRankingCommand("group","student"));
        verify(rankings).save(argThat(row->row.getTotalPoints().compareTo(BigDecimal.TEN)==0));
    }
}
