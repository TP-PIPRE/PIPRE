package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import com.pipre.backend.domain.entities.course.Course;
import com.pipre.backend.domain.entities.course.CourseLevel;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import java.time.LocalDateTime;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class GetCoursesContractTest {
    @Test void returnsEditableFieldsWithoutDiscardingDescriptionOrLevel() {
        var repository = mock(CourseRepositoryPort.class);
        var pageable = PageRequest.of(0, 100);
        var course = Course.builder().idCourse("c1").name("Óptica").description("Descripción guardada")
                .level(CourseLevel.HIGH).createdAt(LocalDateTime.now()).build();
        when(repository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(course)));
        var dto = new GetCoursesService(repository).execute(pageable).getContent().get(0);
        assertEquals("Descripción guardada", dto.description());
        assertEquals("HIGH", dto.level());
    }
}
