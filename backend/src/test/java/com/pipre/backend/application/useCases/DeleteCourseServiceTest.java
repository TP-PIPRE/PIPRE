package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import com.pipre.backend.domain.entities.course.Course;
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
class DeleteCourseServiceTest {

    @Mock
    private CourseRepositoryPort courseRepositoryPort;

    @InjectMocks
    private DeleteCourseService deleteCourseService;

    @Test
    @DisplayName("Debería eliminar un curso si existe")
    void shouldDeleteCourseSuccessfully() {
        // Arrange
        String idCourse = "course-123";
        Course course = Course.builder()
                .idCourse(idCourse)
                .name("Curso Test")
                .level(com.pipre.backend.domain.entities.course.CourseLevel.LOW)
                .createdAt(java.time.LocalDateTime.now())
                .build();
        when(courseRepositoryPort.findById(idCourse)).thenReturn(Optional.of(course));

        // Act
        deleteCourseService.execute(idCourse);

        // Assert
        verify(courseRepositoryPort, times(1)).deleteById(idCourse);
    }

    @Test
    @DisplayName("Debería lanzar ResourceNotFoundException si el curso no existe al eliminar")
    void shouldThrowExceptionWhenCourseNotFound() {
        // Arrange
        String idCourse = "course-unknown";
        when(courseRepositoryPort.findById(idCourse)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> deleteCourseService.execute(idCourse));
        verify(courseRepositoryPort, never()).deleteById(anyString());
    }
}
