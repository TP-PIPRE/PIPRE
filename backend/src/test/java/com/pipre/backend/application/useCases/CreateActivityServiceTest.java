package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.CreateActivityCommand;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.entities.Activity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CreateActivityServiceTest {

    @Mock
    private ActivityRepositoryPort activityRepositoryPort;

    @InjectMocks
    private CreateActivityService createActivityService;

    @Test
    @DisplayName("Debería crear una actividad y retornar su ID")
    void shouldCreateActivityAndReturnId() {
        // Arrange
        CreateActivityCommand cmd = new CreateActivityCommand(
                "lesson-uuid-123",
                "Programación"
        );

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
    }
}