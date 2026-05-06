package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.CourseRequestDTO;
import com.pipre.backend.application.ports.input.CreateCoursesUseCase;
import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import com.pipre.backend.domain.entities.Course;
import com.pipre.backend.domain.factories.CourseFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateCoursesService implements CreateCoursesUseCase {

    private final CourseRepositoryPort courseRepositoryPort;

    @Override
    @Transactional
    public void execute(CourseRequestDTO command) {
        Course newCourse = CourseFactory.createNewCourse(
                command.name(),
                command.description(),
                command.level(),
                "Aprendizaje de robótica",
                null
        );
        courseRepositoryPort.save(newCourse);
    }
}
