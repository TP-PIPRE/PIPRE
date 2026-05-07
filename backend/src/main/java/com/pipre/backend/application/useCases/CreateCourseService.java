package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.RegisterCourseCommand;
import com.pipre.backend.application.ports.input.CreateCourseUseCase;
import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import com.pipre.backend.domain.entities.Course;
import com.pipre.backend.domain.factories.CourseFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateCourseService implements CreateCourseUseCase {

    private final CourseRepositoryPort courseRepositoryPort;

    @Override
    @Transactional
    public String execute(RegisterCourseCommand cmd) {
        Course newCourse = CourseFactory.createNewCourse(
                cmd.name(),
                cmd.description(),
                cmd.level(),
                "Aprendizaje de robótica",
                null
        );
        courseRepositoryPort.save(newCourse);
        return newCourse.getIdCourse();
    }
}
