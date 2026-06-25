package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.ResultDTO;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetStudentResultServiceTest {

    @Mock
    private ResultRepositoryPort resultRepositoryPort;

    @InjectMocks
    private GetStudentResultService getStudentResultService;

    @Test
    @DisplayName("Debería retornar los resultados de un estudiante")
    void shouldReturnStudentResults() {
        // Arrange
        String studentId = "student-123";
        Result result = Result.builder()
                .idResult("res-1")
                .idStudent(studentId)
                .idActivity("act-1")
                .attempts(2)
                .score(BigDecimal.valueOf(8.5))
                .build();
        when(resultRepositoryPort.findByIdStudent(studentId)).thenReturn(List.of(result));

        // Act
        List<ResultDTO> list = getStudentResultService.execute(studentId);

        // Assert
        assertEquals(1, list.size());
        assertEquals("res-1", list.getFirst().idResult());
        assertEquals(studentId, list.getFirst().idStudent());
        assertEquals("act-1", list.getFirst().idActivity());
        assertEquals(BigDecimal.valueOf(8.5), list.getFirst().score());
        assertEquals(2, list.getFirst().attempts());
        assertNotNull(list.getFirst().date());
    }
}
