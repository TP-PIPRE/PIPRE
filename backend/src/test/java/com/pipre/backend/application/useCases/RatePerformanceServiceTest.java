package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.RatingRequestDTO;
import com.pipre.backend.adapters.in.web.dto.RatingResponseDTO;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.domain.entities.result.Result;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RatePerformanceServiceTest {

    @Mock
    private ResultRepositoryPort resultRepositoryPort;

    @InjectMocks
    private RatePerformanceService ratePerformanceService;

    @Test
    @DisplayName("Debería calcular el rating de desempeño basándose en el resultado")
    void shouldRatePerformanceSuccessfully() {
        // Arrange
        RatingRequestDTO req = new RatingRequestDTO("act-123", "res-456", "help-789");
        Result result = Result.builder()
                .idResult("res-456")
                .idStudent("student-1")
                .idActivity("act-123")
                .score(BigDecimal.valueOf(8.0))
                .errors(2)
                .attempts(1)
                .resultSimulation("SUCCESS")
                .build();

        when(resultRepositoryPort.findById("res-456")).thenReturn(Optional.of(result));

        // Act
        RatingResponseDTO resp = ratePerformanceService.execute(req);

        // Assert
        assertEquals("SUCCESS", resp.result());
        assertEquals(BigDecimal.valueOf(0.80).setScale(2), resp.accuracy());
        assertEquals(BigDecimal.valueOf(0.80).setScale(2), resp.precision());
    }
}
