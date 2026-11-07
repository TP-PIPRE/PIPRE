package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.RankingDTO;
import com.pipre.backend.application.ports.output.VerifiedRankingRepositoryPort;
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
import static org.mockito.ArgumentMatchers.anyList;

@ExtendWith(MockitoExtension.class)
class GetGroupRankingServiceTest {

    @Mock
    private VerifiedRankingRepositoryPort rankingRepositoryPort;

    @Mock
    private RankingGamificationView gamification;

    @InjectMocks
    private GetGroupRankingService getGroupRankingService;

    @Test
    @DisplayName("Debería obtener el ranking de un grupo ordenado")
    void shouldReturnGroupRankingOrdered() {
        // Arrange
        String groupId = "group-123";
        RankingDTO r1=new RankingDTO("student-1","Student one",BigDecimal.valueOf(100),1,1,0,0,0,0);
        RankingDTO r2=new RankingDTO("student-2","Student two",BigDecimal.valueOf(90),2,1,0,0,0,0);
        when(rankingRepositoryPort.classroom(groupId)).thenReturn(List.of(r1,r2));
        when(gamification.apply(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        List<RankingDTO> result = getGroupRankingService.execute(groupId);

        // Assert
        assertEquals(2, result.size());
        assertEquals("student-1", result.get(0).idStudent());
        assertEquals(BigDecimal.valueOf(100), result.get(0).totalPoints());
        assertEquals(1, result.get(0).position());

        assertEquals("student-2", result.get(1).idStudent());
        assertEquals(BigDecimal.valueOf(90), result.get(1).totalPoints());
        assertEquals(2, result.get(1).position());
    }
}
