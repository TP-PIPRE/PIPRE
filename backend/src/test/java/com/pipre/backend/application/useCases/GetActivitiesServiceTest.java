package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.ActivityResponseDTO;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.entities.Activity;
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
class GetActivitiesServiceTest {

    @Mock
    private ActivityRepositoryPort repositoryPort;

    @InjectMocks
    private GetActivitiesService getActivitiesService;

    @Test
    @DisplayName("Debería retornar una lista de ActivityResponseDTO")
    void shouldReturnActivityResponseDTOList() {
        // Arrange
        Activity activity1 = new Activity.Builder().idActivity("id-1").name("Actividad 1").build();
        Activity activity2 = new Activity.Builder().idActivity("id-2").name("Actividad 2").build();

        when(repositoryPort.findAll()).thenReturn(List.of(activity1, activity2));

        // Act
        List<ActivityResponseDTO> result = getActivitiesService.execute("any-id");

        // Assert
        assertEquals(2, result.size());
        assertEquals("Actividad 1", result.get(0).name());
        assertEquals("id-1", result.get(0).idActivity());
        assertEquals("Actividad 2", result.get(1).name());

        verify(repositoryPort, times(1)).findAll();
    }
}
