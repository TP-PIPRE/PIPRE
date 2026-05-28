package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.RegisterCourseCommand;
import com.pipre.backend.application.ports.input.UpdateCoursesUseCase;
import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import com.pipre.backend.domain.entities.Course;
import com.pipre.backend.domain.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UpdateCoursesService implements UpdateCoursesUseCase {
    private final CourseRepositoryPort courseRepositoryPort;

    @Override
    @Transactional
    public void execute(String idCourse, RegisterCourseCommand requestDTO) {
        Course course = courseRepositoryPort.findById(idCourse)
                .orElseThrow(() -> new BusinessException("El curso no existe"));

        Course courseUpdated = course.updateCourse(
                requestDTO.name(),
                requestDTO.description(),
                requestDTO.level());
        courseRepositoryPort.save(courseUpdated);
    }
}
