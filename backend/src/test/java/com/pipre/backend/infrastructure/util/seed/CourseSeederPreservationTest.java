package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.course.Course;
import com.pipre.backend.domain.entities.user.User;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Optional;
import static org.mockito.Mockito.*;

class CourseSeederPreservationTest {
    @Test void restartDoesNotDeleteOrOverwriteExistingCourses() {
        var users = mock(UserRepositoryPort.class);
        var courses = mock(CourseRepositoryPort.class);
        var student = mock(User.class);
        when(student.getIsActive()).thenReturn(true);
        when(users.findAll()).thenReturn(List.of(student));
        when(courses.findById("c001")).thenReturn(Optional.of(mock(Course.class)));
        when(courses.findById("c002")).thenReturn(Optional.of(mock(Course.class)));
        var service = new CourseSeederService(users, mock(ActivityRepositoryPort.class), mock(LessonRepositoryPort.class),
                mock(ModuleRepositoryPort.class), courses, mock(SimulationRepositoryPort.class), mock(ResultRepositoryPort.class));
        service.seedCourses();
        verify(courses, never()).deleteById(anyString());
        verify(courses, never()).save(any());
    }
}
