package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.output.RankingRepositoryPort;
import com.pipre.backend.domain.entities.ranking.Ranking;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetGroupRankingServiceTest {

    @Mock
    private RankingRepositoryPort rankingRepositoryPort;

    @InjectMocks
    private GetGroupRankingService getGroupRankingService;

    @Test
    @DisplayName("Debería obtener el ranking de un grupo ordenado")
    void shouldReturnGroupRankingOrdered() {
        // Arrange
        String groupId = "group-123";
        Ranking r1 = Ranking.builder()
                .idRanking("rank-1")
                .idGroup(groupId)
                .idStudent("student-1")
                .totalPoints(BigDecimal.valueOf(100.5))
                .position(1)
                .build();
        Ranking r2 = Ranking.builder()
                .idRanking("rank-2")
                .idGroup(groupId)
                .idStudent("student-2")
                .totalPoints(BigDecimal.valueOf(90.0))
                .position(2)
                .build();

        when(rankingRepositoryPort.findAllByIdGroup(groupId)).thenReturn(List.of(r1, r2));

        // Act
        List<RankingDTO> result = getGroupRankingService.execute(groupId);

        // Assert
        assertEquals(2, result.size());
        assertEquals("student-1", result.get(0).idStudent());
        assertEquals(BigDecimal.valueOf(100.5), result.get(0).totalPoints());
        assertEquals(1, result.get(0).position());

        assertEquals("student-2", result.get(1).idStudent());
        assertEquals(BigDecimal.valueOf(90.0), result.get(1).totalPoints());
        assertEquals(2, result.get(1).position());
    }
}
