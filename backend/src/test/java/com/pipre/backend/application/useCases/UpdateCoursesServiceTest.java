package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.RegisterCourseCommand;
import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import com.pipre.backend.domain.entities.Course;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UpdateCoursesServiceTest {

    @Mock private CourseRepositoryPort courseRepositoryPort;
    @InjectMocks private UpdateCoursesService updateCoursesService;

    @Test
    @DisplayName("Debería actualizar los datos del curso correctamente")
    void shouldUpdateCourseSuccessfully() {
        // Arrange
        String courseId = "course-456";
        RegisterCourseCommand updateCmd = new RegisterCourseCommand(
                "Nuevo Nombre", "Nueva Desc", "Avanzado"
        );

        Course existingCourse = Course.builder()
                .idCourse(courseId)
                .name("Nombre Viejo")
                .description("Desc Vieja")
                .level("Básico")
                .idModuleList(List.of())
                .build();

        when(courseRepositoryPort.findById(courseId)).thenReturn(Optional.of(existingCourse));

        // Act
        updateCoursesService.execute(courseId, updateCmd);

        // Assert
        verify(courseRepositoryPort).save(argThat(course ->
                course.getIdCourse().equals(courseId) &&
                        course.getName().equals("Nuevo Nombre") &&
                        course.getLevel().equals("Avanzado")
        ));
    }
}