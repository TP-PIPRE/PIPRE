package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.ModuleProgressDTO;
import com.pipre.backend.application.ports.output.ModuleProgressRepositoryPort;
import com.pipre.backend.domain.entities.moduleprogress.ModuleProgress;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetModuleProgressServiceTest {

    @Mock
    private ModuleProgressRepositoryPort moduleProgressRepositoryPort;

    @InjectMocks
    private GetModuleProgressService getModuleProgressService;

    @Test
    @DisplayName("Debería obtener todo el progreso de módulos de un estudiante")
    void shouldGetModuleProgressSuccessfully() {
        // Arrange
        String idStudent = "student-123";
        ModuleProgress mp1 = ModuleProgress.builder()
                .idProgress("progress-1")
                .percentage(BigDecimal.valueOf(45.0))
                .status("IN_PROGRESS")
                .updatedAt(LocalDateTime.now())
                .idStudent(idStudent)
                .idModule("module-1")
                .build();
        ModuleProgress mp2 = ModuleProgress.builder()
                .idProgress("progress-2")
                .percentage(BigDecimal.valueOf(100.0))
                .status("COMPLETED")
                .updatedAt(LocalDateTime.now())
                .idStudent(idStudent)
                .idModule("module-2")
                .build();

        when(moduleProgressRepositoryPort.findAllByIdStudent(idStudent)).thenReturn(List.of(mp1, mp2));

        // Act
        List<ModuleProgressDTO> result = getModuleProgressService.execute(idStudent);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("progress-1", result.get(0).idProgress());
        assertEquals("IN_PROGRESS", result.get(0).status());
        assertEquals("progress-2", result.get(1).idProgress());
        assertEquals("COMPLETED", result.get(1).status());
    }
}
