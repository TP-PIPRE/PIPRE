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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
    @DisplayName("Debería retornar una lista paginada de ActivityDTO cuando la lección existe")
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

        Pageable pageable = PageRequest.of(0, 10);
        Page<Activity> page = new PageImpl<>(List.of(activity1, activity2));

        when(lessonRepositoryPort.existsById("any-id")).thenReturn(true);
        when(repositoryPort.findByLessonId(eq("any-id"), any(Pageable.class))).thenReturn(page);

        // Act
        Page<ActivityDTO> result = getActivitiesService.execute("any-id", pageable);

        // Assert
        assertEquals(2, result.getContent().size());
        assertEquals("Actividad 1", result.getContent().get(0).name());
        assertEquals("id-1", result.getContent().get(0).idActivity());
        assertEquals("Actividad 2", result.getContent().get(1).name());

        verify(lessonRepositoryPort, times(1)).existsById("any-id");
        verify(repositoryPort, times(1)).findByLessonId("any-id", pageable);
    }

    @Test
    @DisplayName("Debería lanzar ResourceNotFoundException si la lección no existe")
    void shouldThrowExceptionWhenLessonDoesNotExist() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        when(lessonRepositoryPort.existsById("non-existent-id")).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> 
            getActivitiesService.execute("non-existent-id", pageable)
        );

        verify(lessonRepositoryPort, times(1)).existsById("non-existent-id");
        verifyNoInteractions(repositoryPort);
    }
}
