package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.output.ModuleRepositoryPort;
import com.pipre.backend.domain.entities.module.Module;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeleteModuleServiceTest {

    @Mock
    private ModuleRepositoryPort moduleRepositoryPort;

    @InjectMocks
    private DeleteModuleService deleteModuleService;

    @Test
    @DisplayName("Debería eliminar un módulo si existe")
    void shouldDeleteModuleSuccessfully() {
        // Arrange
        String idModule = "module-123";
        Module module = Module.builder().idModule(idModule).title("Modulo Test").idCourse("course-1").build();
        when(moduleRepositoryPort.findById(idModule)).thenReturn(Optional.of(module));

        // Act
        deleteModuleService.execute(idModule);

        // Assert
        verify(moduleRepositoryPort, times(1)).deleteById(idModule);
    }

    @Test
    @DisplayName("Debería lanzar ResourceNotFoundException si el módulo no existe al eliminar")
    void shouldThrowExceptionWhenModuleNotFound() {
        // Arrange
        String idModule = "module-unknown";
        when(moduleRepositoryPort.findById(idModule)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> deleteModuleService.execute(idModule));
        verify(moduleRepositoryPort, never()).deleteById(anyString());
    }
}
