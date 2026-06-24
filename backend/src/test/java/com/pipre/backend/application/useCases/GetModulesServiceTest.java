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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetModulesServiceTest {

    @Mock private ModuleRepositoryPort moduleRepositoryPort;
    @InjectMocks private GetModulesService getModulesService;

    @Test
    @DisplayName("Debería retornar módulos filtrados por ID de curso paginados")
    void shouldReturnModulesByCourseId() {
        // Arrange
        String courseId = "course-123";
        Module module = Module.builder().idModule("mod-1").title("Módulo Test").idCourse(courseId).build();
        Pageable pageable = PageRequest.of(0, 10);
        Page<Module> page = new PageImpl<>(List.of(module));
        when(moduleRepositoryPort.findAllByIdCourse(eq(courseId), any(Pageable.class))).thenReturn(page);

        // Act
        Page<ModuleDTO> result = getModulesService.execute(courseId, pageable);

        // Assert
        assertEquals(1, result.getContent().size());
        assertEquals("mod-1", result.getContent().get(0).idModule());
        assertEquals("Módulo Test", result.getContent().get(0).title());
        verify(moduleRepositoryPort, times(1)).findAllByIdCourse(courseId, pageable);
    }
}
