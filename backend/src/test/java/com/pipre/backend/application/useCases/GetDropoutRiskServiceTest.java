package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.DropoutRiskDTO;
import com.pipre.backend.application.ports.output.DropoutRiskRepositoryPort;
import com.pipre.backend.domain.entities.dropoutrisk.DropoutRisk;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetDropoutRiskServiceTest {

    @Mock
    private DropoutRiskRepositoryPort dropoutRiskRepositoryPort;

    @InjectMocks
    private GetDropoutRiskService getDropoutRiskService;

    @Test
    @DisplayName("Debería obtener el análisis de riesgo de deserción correctamente si existe")
    void shouldGetDropoutRiskSuccessfully() {
        // Arrange
        String idStudent = "student-123";
        DropoutRisk dr = DropoutRisk.builder()
                .idRisk("risk-abc")
                .daysInactive(5)
                .performance("Bajo rendimiento en lecciones")
                .riskLevel("ALTO")
                .motivationLevel("BAJA")
                .analysisDate(LocalDateTime.now())
                .idStudent(idStudent)
                .build();

        when(dropoutRiskRepositoryPort.findByIdStudent(idStudent)).thenReturn(Optional.of(dr));

        // Act
        DropoutRiskDTO result = getDropoutRiskService.execute(idStudent);

        // Assert
        assertNotNull(result);
        assertEquals("risk-abc", result.idRisk());
        assertEquals(5, result.daysInactive());
        assertEquals("Bajo rendimiento en lecciones", result.performance());
        assertEquals("ALTO", result.riskLevel());
        assertEquals("BAJA", result.motivationLevel());
        assertEquals(idStudent, result.idStudent());
    }

    @Test
    @DisplayName("Debería lanzar ResourceNotFoundException si no existe análisis de riesgo para el estudiante")
    void shouldThrowExceptionWhenRiskNotFound() {
        // Arrange
        String idStudent = "student-123";
        when(dropoutRiskRepositoryPort.findByIdStudent(idStudent)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> getDropoutRiskService.execute(idStudent));
    }
}
