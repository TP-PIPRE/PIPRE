package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateModuleCommand;
import com.pipre.backend.application.ports.output.ModuleRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CreateModuleServiceTest {

    @Mock
    private ModuleRepositoryPort moduleRepositoryPort;

    @InjectMocks
    private CreateModuleService createModuleService;

    @Test
    @DisplayName("Debería crear un módulo vinculado al curso")
    void shouldCreateModuleSuccessfully() {
        // Arrange
        CreateModuleCommand cmd = new CreateModuleCommand(
                "course-999",
                "Módulo de Electrónica");

        // Act
        String moduleId = createModuleService.execute(cmd);

        // Assert
        assertNotNull(moduleId);
        verify(moduleRepositoryPort, times(1)).save(argThat(module ->
                module.getTitle().equals(cmd.title()) &&
                        module.getIdCourse().equals(cmd.idCourse()) &&
                        module.getIdModule().equals(moduleId)
        ));
    }
}
