package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateActivityCommand;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;

import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreateActivityServiceTest {

    @Mock
    private ActivityRepositoryPort activityRepositoryPort;

    @Mock
    private LessonRepositoryPort lessonRepositoryPort;

    @InjectMocks
    private CreateActivityService createActivityService;

    @Test
    @DisplayName("Debería crear una actividad y retornar su ID cuando la lección existe")
    void shouldCreateActivityAndReturnId() {
        // Arrange
        CreateActivityCommand cmd = new CreateActivityCommand(
                "lesson-uuid-123",
                "Programación",
                null, null, null, null, null, null, null, null
        );

        when(lessonRepositoryPort.existsById("lesson-uuid-123")).thenReturn(true);

        // Act
        String generatedId = createActivityService.execute(cmd);

        // Assert
        assertNotNull(generatedId);
        assertFalse(generatedId.isEmpty());

        // Verificamos que se llamó al save con la entidad correcta
        ArgumentCaptor<Activity> activityCaptor = ArgumentCaptor.forClass(Activity.class);
        verify(activityRepositoryPort, times(1)).save(activityCaptor.capture());

        Activity savedActivity = activityCaptor.getValue();
        assertEquals(cmd.name(), savedActivity.getName());
        assertEquals(cmd.idLesson(), savedActivity.getIdLesson());
        assertEquals(generatedId, savedActivity.getIdActivity());
        verify(lessonRepositoryPort, times(1)).existsById("lesson-uuid-123");
    }

    @Test
    @DisplayName("Debería lanzar ResourceNotFoundException al crear actividad si la lección no existe")
    void shouldThrowExceptionWhenLessonDoesNotExist() {
        // Arrange
        CreateActivityCommand cmd = new CreateActivityCommand(
                "non-existent-lesson",
                "Programación",
                null, null, null, null, null, null, null, null
        );

        when(lessonRepositoryPort.existsById("non-existent-lesson")).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
            createActivityService.execute(cmd)
        );

        verify(lessonRepositoryPort, times(1)).existsById("non-existent-lesson");
        verifyNoInteractions(activityRepositoryPort);
    }
}