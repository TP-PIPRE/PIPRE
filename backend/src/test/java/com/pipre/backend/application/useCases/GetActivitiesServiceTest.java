package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.ActivityDTO;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;

import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetActivitiesServiceTest {

    @Mock
    private ActivityRepositoryPort repositoryPort;

    @Mock
    private LessonRepositoryPort lessonRepositoryPort;

    @InjectMocks
    private GetActivitiesService getActivitiesService;

    @Test
    @DisplayName("Debería retornar una lista de ActivityDTO cuando la lección existe")
    void shouldReturnActivityDTOList() {
        // Arrange
        Activity activity1 = Activity.builder()
                .idActivity("id-1")
                .name("Actividad 1")
                .idLesson("lesson-1")
                .build();
        Activity activity2 = Activity.builder()
                .idActivity("id-2")
                .name("Actividad 2")
                .idLesson("lesson-1")
                .build();

        when(lessonRepositoryPort.existsById("any-id")).thenReturn(true);
        when(repositoryPort.findByLessonId("any-id")).thenReturn(List.of(activity1, activity2));

        // Act
        List<ActivityDTO> result = getActivitiesService.execute("any-id");

        // Assert
        assertEquals(2, result.size());
        assertEquals("Actividad 1", result.get(0).name());
        assertEquals("id-1", result.get(0).idActivity());
        assertEquals("Actividad 2", result.get(1).name());

        verify(lessonRepositoryPort, times(1)).existsById("any-id");
        verify(repositoryPort, times(1)).findByLessonId("any-id");
    }

    @Test
    @DisplayName("Debería lanzar ResourceNotFoundException si la lección no existe")
    void shouldThrowExceptionWhenLessonDoesNotExist() {
        // Arrange
        when(lessonRepositoryPort.existsById("non-existent-id")).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> 
            getActivitiesService.execute("non-existent-id")
        );

        verify(lessonRepositoryPort, times(1)).existsById("non-existent-id");
        verifyNoInteractions(repositoryPort);
    }
}
