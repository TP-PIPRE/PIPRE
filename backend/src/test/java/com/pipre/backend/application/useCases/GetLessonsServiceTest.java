package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.LessonDTO;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.entities.lesson.Lesson;
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
class GetLessonsServiceTest {

    @Mock private LessonRepositoryPort lessonRepositoryPort;
    @InjectMocks private GetLessonsService getLessonsService;

    @Test
    @DisplayName("Debería retornar lecciones filtradas por ID de módulo")
    void shouldReturnLessonsByModuleId() {
        // Arrange
        String moduleId = "mod-123";
        Lesson lesson = Lesson.builder().idLesson("les-1").title("Lección Test").idModule(moduleId).build();
        when(lessonRepositoryPort.findAll()).thenReturn(List.of(lesson));

        // Act
        List<LessonDTO> result = getLessonsService.execute(moduleId);

        // Assert
        assertEquals(1, result.size());
        assertEquals("les-1", result.getFirst().idLesson());
        assertEquals("Lección Test", result.getFirst().title());
    }
}
