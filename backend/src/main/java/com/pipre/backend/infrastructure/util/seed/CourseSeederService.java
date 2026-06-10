package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.*;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.entities.Module;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.activity.ActivityLevel;
import com.pipre.backend.domain.entities.course.Course;
import com.pipre.backend.domain.entities.course.CourseLevel;

import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourseSeederService {

    private final Faker faker = new Faker();
    private final UserRepositoryPort userRepositoryPort;
    private final ActivityRepositoryPort activityRepositoryPort;
    private final LessonRepositoryPort lessonRepositoryPort;
    private final ModuleRepositoryPort moduleRepositoryPort;
    private final CourseRepositoryPort courseRepositoryPort;
    private final SimulationRepositoryPort simulationRepositoryPort;

    @Transactional
    public void seedCourses() {
        List<User> students = userRepositoryPort.findAll().stream()
                .filter(User::getIsActive)
                .toList();

        if (students.isEmpty())
            return;

        int NUMBER_OF_COURSES = 1;
        int NUMBER_OF_MODULES = 1;
        int NUMBER_OF_LESSONS = 1;
        int NUMBER_OF_ACTIVITIES = 1;
        int NUMBER_OF_SIMULATIONS = 1;

        for (int i = 0; i < NUMBER_OF_COURSES; i++) {
            Course course = Course.builder()
                    .idCourse(UUID.randomUUID().toString())
                    .name(faker.educator().course())
                    .description(faker.lorem().sentence(8))
                    .level(faker.options().option(CourseLevel.LOW, CourseLevel.MEDIUM, CourseLevel.HIGH))
                    .createdAt(LocalDateTime.now().minusDays(
                            faker.number().numberBetween(1, 120)))
                    .build();
            courseRepositoryPort.save(course);
            String courseId = course.getIdCourse();

            for (int j = 1; j <= NUMBER_OF_MODULES; j++) {
                Module module = Module.builder()
                        .idModule(UUID.randomUUID().toString())
                        .title("Módulo de " + faker.educator().subjectWithNumber())
                        .idCourse(courseId)
                        .build();
                moduleRepositoryPort.save(module);
                String moduleId = module.getIdModule();

                for (int k = 1; k <= NUMBER_OF_LESSONS; k++) {
                    Lesson lesson = Lesson.builder()
                            .idLesson(UUID.randomUUID().toString())
                            .title("Lección de " + faker.educator().subjectWithNumber())
                            .idModule(moduleId)
                            .build();
                    lessonRepositoryPort.save(lesson);
                    String lessonId = lesson.getIdLesson();

                    for (int l = 1; l <= NUMBER_OF_ACTIVITIES; l++) {
                        Activity activity = Activity.builder()
                                .idActivity(UUID.randomUUID().toString())
                                .name("Actividad de " + faker.hacker().verb())
                                .logicLevel(faker.options().option(ActivityLevel.LOW, ActivityLevel.MEDIUM,
                                        ActivityLevel.HIGH))
                                .idLesson(lessonId)
                                .build();
                        activityRepositoryPort.save(activity);
                        String idActivity = activity.getIdActivity();
                        for (int m = 1; m <= NUMBER_OF_SIMULATIONS; m++) {
                            User randomStudent = faker.options().nextElement(students);
                            Simulation simulation = Simulation.builder()
                                    .idSimulation(UUID.randomUUID().toString())
                                    .result(faker.options().option("SUCCESS", "FAILURE"))
                                    .idActivity(idActivity)
                                    .idStudent(randomStudent.getIdUser())
                                    .build();
                            simulationRepositoryPort.save(simulation);
                        }
                    }
                }
            }
        }
    }
}