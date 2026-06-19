package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.ModuleDTO;
import com.pipre.backend.application.ports.output.ModuleRepositoryPort;
import com.pipre.backend.domain.entities.module.Module;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetModulesServiceTest {

    @Mock private ModuleRepositoryPort moduleRepositoryPort;
    @InjectMocks private GetModulesService getModulesService;

    @Test
    @DisplayName("Debería retornar módulos filtrados por ID de curso")
    void shouldReturnModulesByCourseId() {
        // Arrange
        String courseId = "course-123";
        Module module = Module.builder().idModule("mod-1").title("Módulo Test").idCourse(courseId).build();
        when(moduleRepositoryPort.findAllByIdCourse(courseId)).thenReturn(List.of(module));

        // Act
        List<ModuleDTO> result = getModulesService.execute(courseId);

        // Assert
        assertEquals(1, result.size());
        assertEquals("mod-1", result.getFirst().idModule());
        assertEquals("Módulo Test", result.getFirst().title());
        verify(moduleRepositoryPort, times(1)).findAllByIdCourse(courseId);
    }
}
