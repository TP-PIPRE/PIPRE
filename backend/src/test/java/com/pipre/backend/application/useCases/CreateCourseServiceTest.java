package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.RegisterCourseCommand;
import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreateCourseServiceTest {

    @Mock
    private CourseRepositoryPort courseRepositoryPort;

    @InjectMocks
    private CreateCourseService createCourseService;

    @Test
    @DisplayName("Debería crear un curso exitosamente")
    void shouldCreateCourseSuccessfully() {
        // Arrange
        RegisterCourseCommand cmd = new RegisterCourseCommand(
                "Robótica Educativa",
                "Descripción del curso",
                "Básico"
        );

        // Act
        String courseId = createCourseService.execute(cmd);

        // Assert
        assertNotNull(courseId);

        // Verificamos que se guardó un objeto Course con los datos correctos
        verify(courseRepositoryPort, times(1)).save(argThat(course ->
                course.getName().equals("Robótica Educativa") &&
                        course.getLevel().equals("Básico") &&
                        course.getIdCourse().equals(courseId)
        ));
    }
}