package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.SaveModuleProgressCommand;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SaveModuleProgressServiceTest {

    @Mock
    private ModuleProgressRepositoryPort moduleProgressRepositoryPort;

    @InjectMocks
    private SaveModuleProgressService saveModuleProgressService;

    @Test
    @DisplayName("Debería actualizar progreso existente si ya existe para alumno y módulo")
    void shouldUpdateExistingProgressSuccessfully() {
        // Arrange
        String idStudent = "student-123";
        String idModule = "module-456";
        SaveModuleProgressCommand command = new SaveModuleProgressCommand(idStudent, idModule, BigDecimal.valueOf(80.5), "IN_PROGRESS");

        ModuleProgress existing = ModuleProgress.builder()
                .idProgress("progress-111")
                .percentage(BigDecimal.valueOf(50.0))
                .status("STARTED")
                .updatedAt(LocalDateTime.now().minusDays(1))
                .idStudent(idStudent)
                .idModule(idModule)
                .build();

        when(moduleProgressRepositoryPort.findByStudentAndModule(idStudent, idModule)).thenReturn(Optional.of(existing));

        // Act
        String result = saveModuleProgressService.execute(command);

        // Assert
        assertEquals("progress-111", result);
        verify(moduleProgressRepositoryPort, times(1)).save(argThat(progress ->
                progress.getIdProgress().equals("progress-111") &&
                progress.getPercentage().compareTo(BigDecimal.valueOf(80.5)) == 0 &&
                progress.getStatus().equals("IN_PROGRESS") &&
                progress.getIdStudent().equals(idStudent) &&
                progress.getIdModule().equals(idModule)
        ));
    }

    @Test
    @DisplayName("Debería crear un nuevo progreso si no existe previo")
    void shouldCreateNewProgressSuccessfully() {
        // Arrange
        String idStudent = "student-123";
        String idModule = "module-456";
        SaveModuleProgressCommand command = new SaveModuleProgressCommand(idStudent, idModule, BigDecimal.valueOf(100.0), "COMPLETED");

        when(moduleProgressRepositoryPort.findByStudentAndModule(idStudent, idModule)).thenReturn(Optional.empty());

        // Act
        String result = saveModuleProgressService.execute(command);

        // Assert
        assertNotNull(result);
        verify(moduleProgressRepositoryPort, times(1)).save(argThat(progress ->
                progress.getIdProgress().equals(result) &&
                progress.getPercentage().compareTo(BigDecimal.valueOf(100.0)) == 0 &&
                progress.getStatus().equals("COMPLETED") &&
                progress.getIdStudent().equals(idStudent) &&
                progress.getIdModule().equals(idModule)
        ));
    }
}
