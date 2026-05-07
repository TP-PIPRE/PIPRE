package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.CreateLessonCommand;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
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
class CreateLessonServiceTest {

    @Mock
    private LessonRepositoryPort lessonRepositoryPort;

    @InjectMocks
    private CreateLessonService createLessonService;

    @Test
    @DisplayName("Debería crear una lección y retornar su ID")
    void shouldCreateLessonSuccessfully() {
        // Arrange
        CreateLessonCommand cmd = new CreateLessonCommand(
                "module-123",
                "Introducción a Bucles"
                );

        // Act
        String lessonId = createLessonService.execute(cmd);

        // Assert
        assertNotNull(lessonId);
        verify(lessonRepositoryPort, times(1)).save(argThat(lesson ->
                lesson.getTitle().equals(cmd.title()) &&
                        lesson.getIdModule().equals(cmd.idModule()) &&
                        lesson.getIdLesson().equals(lessonId)
        ));
    }
}