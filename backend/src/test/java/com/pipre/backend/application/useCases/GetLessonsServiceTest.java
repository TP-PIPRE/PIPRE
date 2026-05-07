package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.LessonResponseDTO;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.entities.Lesson;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetLessonsServiceTest {

    @Mock private LessonRepositoryPort lessonRepositoryPort;
    @InjectMocks private GetLessonsService getLessonsService;

    @Test
    @DisplayName("Debería retornar todas las lecciones")
    void shouldReturnAllLessons() {
        // Arrange
        Lesson lesson = new Lesson.Builder().idLesson("les-1").title("Lección 1").build();
        when(lessonRepositoryPort.findAll()).thenReturn(List.of(lesson));

        // Act
        List<LessonResponseDTO> result = getLessonsService.execute("any-module-id");

        // Assert
        assertFalse(result.isEmpty());
        assertEquals("les-1", result.get(0).idLesson());
        verify(lessonRepositoryPort, times(1)).findAll();
    }
}
