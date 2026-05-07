package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.CourseResponseDTO;
import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import com.pipre.backend.domain.entities.Course;
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
class GetCoursesServiceTest {

    @Mock private CourseRepositoryPort repositoryPort;
    @InjectMocks private GetCoursesService getCoursesService;

    @Test
    @DisplayName("Debería retornar la lista de todos los cursos")
    void shouldReturnAllCourses() {
        // Arrange
        Course course = Course.builder().idCourse("c-1").name("Curso Robótica").build();
        when(repositoryPort.findAll()).thenReturn(List.of(course));

        // Act
        List<CourseResponseDTO> result = getCoursesService.execute();

        // Assert
        assertEquals(1, result.size());
        assertEquals("Curso Robótica", result.get(0).name());
        verify(repositoryPort, times(1)).findAll();
    }
}
