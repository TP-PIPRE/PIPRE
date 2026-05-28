package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.application.commands.CreateLessonCommand;
import com.pipre.backend.application.commands.CreateModuleCommand;
import com.pipre.backend.application.commands.RegisterCourseCommand;
import com.pipre.backend.application.ports.input.*;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.Activity;
import com.pipre.backend.domain.entities.User;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourseSeederService {

    private final CreateCourseUseCase createCourseUseCase;
    private final CreateModuleUseCase createModuleUseCase;
    private final CreateLessonUseCase createLessonUseCase;

    private final UserRepositoryPort userRepositoryPort;

    private final Faker faker = new Faker();
    private final ActivityRepositoryPort activityRepositoryPort;

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
                        activityRepositoryPort.save(Activity.builder()
                                .idActivity(UUID.randomUUID().toString())
                                .name("Reto: " + faker.funnyName().name())
                                .logicLevel(faker.options().option("low", "medium", "high"))
                                .idLesson(lessonId)
                                .build()
                        );
                    }
                }
            }
        }
    }
}