package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.AddStudentRankingCommand;
import com.pipre.backend.application.ports.output.RankingRepositoryPort;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.domain.entities.result.Result;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddStudentRankingServiceTest {

    @Mock
    private RankingRepositoryPort rankingRepositoryPort;

    @Mock
    private ResultRepositoryPort resultRepositoryPort;

    @InjectMocks
    private AddStudentRankingService addStudentRankingService;

    @Test
    @DisplayName("Debería agregar un estudiante al ranking sumando sus puntajes previos")
    void shouldAddStudentRankingSuccessfully() {
        // Arrange
        String studentId = "student-123";
        String groupId = "group-456";
        AddStudentRankingCommand cmd = new AddStudentRankingCommand(groupId, studentId);

        Result result1 = Result.builder()
                .idResult("res-1")
                .idStudent(studentId)
                .idActivity("act-1")
                .score(BigDecimal.valueOf(10.5))
                .build();
        Result result2 = Result.builder()
                .idResult("res-2")
                .idStudent(studentId)
                .idActivity("act-2")
                .score(BigDecimal.valueOf(15.0))
                .build();

        when(resultRepositoryPort.findByIdStudent(studentId)).thenReturn(List.of(result1, result2));

        // Act
        addStudentRankingService.execute(cmd);

        // Assert
        verify(rankingRepositoryPort, times(1)).save(argThat(ranking ->
                ranking.getIdStudent().equals(studentId) &&
                        ranking.getIdGroup().equals(groupId) &&
                        ranking.getTotalPoints().compareTo(BigDecimal.valueOf(25.5)) == 0
        ));
        verify(rankingRepositoryPort, times(1)).sortRanking(groupId);
    }
}
