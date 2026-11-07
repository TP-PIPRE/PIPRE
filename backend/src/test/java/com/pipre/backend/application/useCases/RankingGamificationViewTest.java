package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.GameProgressDTO;
import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.input.GetGameProgressUseCase;
import com.pipre.backend.application.ports.output.GamificationRepositoryPort;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;
import com.pipre.backend.application.ports.output.RankingMetadataPort;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RankingGamificationViewTest {
    @Test void keepsRankingPointsAndOrderWhileUsingOneGlobalBalancePerStudent() {
        var metadata=mock(RankingMetadataPort.class);
        var view = new RankingGamificationView(metadata);
        when(metadata.load(Set.of("student"))).thenReturn(Map.of("student",new RankingMetadataPort.Metadata(2,450,6,1,5)));
        var source = List.of(
                new RankingDTO("student", "A", new BigDecimal("73.5"), 1, 1, 120, 90, 9, 9),
                new RankingDTO("student", "A", new BigDecimal("51"), 2, 1, 90, 70, 4, 4));
        var result = view.apply(source);
        assertEquals(source.stream().map(RankingDTO::totalPoints).toList(), result.stream().map(RankingDTO::totalPoints).toList());
        assertEquals(List.of(1, 2), result.stream().map(RankingDTO::position).toList());
        assertTrue(result.stream().allMatch(row -> row.xpTotal() == 450 && row.totalStars() == 6
                && row.currentStreak() == 1 && row.maxStreak() == 5 && row.level() == 2));
        assertEquals(120, source.getFirst().xpTotal()); // Historical input is untouched.
        verify(metadata).load(Set.of("student"));
        verifyNoMoreInteractions(metadata);
    }

    @Test void anEmptyRankingDoesNotQueryOrCreateStudentData() {
        var metadata=mock(RankingMetadataPort.class);
        assertEquals(List.of(), new RankingGamificationView(metadata).apply(List.of()));
        verifyNoInteractions(metadata);
    }
}
