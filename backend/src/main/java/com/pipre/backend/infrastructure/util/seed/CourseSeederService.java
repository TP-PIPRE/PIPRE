package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.adapters.in.web.dto.CreateActivityCommand;
import com.pipre.backend.adapters.in.web.dto.CreateLessonCommand;
import com.pipre.backend.adapters.in.web.dto.CreateModuleCommand;
import com.pipre.backend.adapters.in.web.dto.RegisterCourseCommand;
import com.pipre.backend.application.ports.input.*;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.User;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class CourseSeederService {

    private final CreateCourseUseCase createCourseUseCase;
    private final CreateModuleUseCase createModuleUseCase;
    private final CreateLessonUseCase createLessonUseCase;
    private final CreateActivityUseCase createActivityUseCase;

    private final UserRepositoryPort userRepositoryPort;

    private final Faker faker = new Faker();

    @Transactional
    public void seedCourses() {
        List<User> students = userRepositoryPort.findAll().stream()
                .filter(User::getActive)
                .toList();

        if (students.isEmpty()) return;

        for (int i = 0; i < 3; i++) {
            String idCourse = createCourseUseCase.execute(new RegisterCourseCommand(
                    "Robótica " + faker.job().field(),
                    faker.lorem().sentence( ),
                    faker.options().option("Básico", "Intermedio", "Avanzado")
            ));

            for (int j = 1; j <= 3; j++) {
                String idModule = createModuleUseCase.execute(new CreateModuleCommand(
                        idCourse,
                        "Módulo " + j + ": " + faker.educator().course()
                ));

                for (int k = 1; k <= 2; k++) {
                    String lessonId = createLessonUseCase.execute(new CreateLessonCommand(
                            idModule,
                            faker.book().title()
                    ));

                    for (int l = 1; l <= 2; l++) {
                        createActivityUseCase.execute(new CreateActivityCommand(
                                lessonId,
                                "Reto: " + faker.funnyName().name()
                        ));

                    }
                }
            }
        }
    }
}