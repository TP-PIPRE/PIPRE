package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;
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
class DeleteActivityServiceTest {

    @Mock
    private ActivityRepositoryPort activityRepositoryPort;

    @InjectMocks
    private DeleteActivityService deleteActivityService;

    @Test
    @DisplayName("Debería eliminar una actividad si existe")
    void shouldDeleteActivitySuccessfully() {
        // Arrange
        String idActivity = "activity-123";
        Activity activity = Activity.builder().idActivity(idActivity).name("Actividad Test").idLesson("lesson-1").build();
        when(activityRepositoryPort.findById(idActivity)).thenReturn(Optional.of(activity));

        // Act
        deleteActivityService.execute(idActivity);

        // Assert
        verify(activityRepositoryPort, times(1)).deleteById(idActivity);
    }

    @Test
    @DisplayName("Debería lanzar ResourceNotFoundException si la actividad no existe al eliminar")
    void shouldThrowExceptionWhenActivityNotFound() {
        // Arrange
        String idActivity = "activity-unknown";
        when(activityRepositoryPort.findById(idActivity)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> deleteActivityService.execute(idActivity));
        verify(activityRepositoryPort, never()).deleteById(anyString());
    }
}
