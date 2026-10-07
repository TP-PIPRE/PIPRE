package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.entities.module.Module;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.activity.ActivityLevel;
import com.pipre.backend.domain.entities.course.Course;
import com.pipre.backend.domain.entities.course.CourseLevel;
import com.pipre.backend.domain.entities.lesson.Lesson;
import com.pipre.backend.domain.entities.simulation.Simulation;
import com.pipre.backend.domain.entities.simulation.SimulationResult;

import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
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
    private final ResultRepositoryPort resultRepositoryPort;

    private static final Set<String> OFFICIAL_COURSE_IDS = Set.of("c001", "c002");

    private static final int NUMBER_OF_SIMULATIONS = 3;

    @Transactional
    public void seedCourses() {
        List<User> students = userRepositoryPort.findAll().stream()
                .filter(User::getIsActive)
                .toList();

        if (students.isEmpty())
            return;

        removeLegacyCourses();

        seedNeonFlowCourse(students);
        seedTetriLogicCourse(students);
    }

    private void removeLegacyCourses() {
        courseRepositoryPort.findAll().stream()
                .map(Course::getIdCourse)
                .filter(id -> !OFFICIAL_COURSE_IDS.contains(id))
                .forEach(courseRepositoryPort::deleteById);

        OFFICIAL_COURSE_IDS.forEach(courseRepositoryPort::deleteById);
    }

    private void seedNeonFlowCourse(List<User> students) {
        String courseId = "c001";
        Course course = Course.builder()
                .idCourse(courseId)
                .name("Neon Flow")
                .description("Simulador web gamificado de lógica proposicional y condicionales: guía el láser hasta los receptores usando espejos, filtros y razonamiento deductivo.")
                .level(CourseLevel.MEDIUM)
                .createdAt(LocalDateTime.now().minusDays(90))
                .build();
        courseRepositoryPort.save(course);

        String moduleId = "mod-c001-l1";
        moduleRepositoryPort.save(Module.builder()
                .idModule(moduleId)
                .title("Lógica Proposicional y Condicionales")
                .idCourse(courseId)
                .build());

        String lessonId = "les-c001-l1";
        lessonRepositoryPort.save(Lesson.builder()
                .idLesson(lessonId)
                .title("Introducción a Neon Flow")
                .idModule(moduleId)
                .build());

        saveActivity(lessonId, "act-c001-1", "Neon Flow - Nivel 1",
                ActivityLevel.LOW, "EASY", "neonflow",
                "Ilumina el receptor rojo",
                "Guía el láser rojo del emisor (0,2) hasta el receptor (4,2) en un tablero 5x5 usando espejos y filtros.",
                students);

        saveActivity(lessonId, "act-c001-2", "Neon Flow - Nivel 2",
                ActivityLevel.MEDIUM, "MEDIUM", "neonflow",
                "Esquiva los muros",
                "Redirige el láser sorteando los muros con espejos rotados para iluminar el receptor.",
                students);
    }

    private void seedTetriLogicCourse(List<User> students) {
        String courseId = "c002";
        Course course = Course.builder()
                .idCourse(courseId)
                .name("TetriLogic")
                .description("Simulador web gamificado de razonamiento espacial y patrones: encaja Tetriminos en tableros con restricciones para entrenar planificación y resolución de problemas.")
                .level(CourseLevel.MEDIUM)
                .createdAt(LocalDateTime.now().minusDays(90))
                .build();
        courseRepositoryPort.save(course);

        String moduleId = "mod-c002-r1";
        moduleRepositoryPort.save(Module.builder()
                .idModule(moduleId)
                .title("Razonamiento Espacial y Patrones")
                .idCourse(courseId)
                .build());

        String lessonId = "les-c002-r1";
        lessonRepositoryPort.save(Lesson.builder()
                .idLesson(lessonId)
                .title("Introducción a TetriLogic")
                .idModule(moduleId)
                .build());

        saveActivity(lessonId, "act-c002-1", "TetriLogic - Nivel 1",
                ActivityLevel.LOW, "EASY", "tetrilogic",
                "Cubre el tablero 4x4",
                "Encaja los Tetriminos para cubrir el tablero cumpliendo el conteo de celdas por fila y columna.",
                students);

        saveActivity(lessonId, "act-c002-2", "TetriLogic - Nivel 2",
                ActivityLevel.MEDIUM, "MEDIUM", "tetrilogic",
                "Esquiva las celdas bloqueadas",
                "Encaja los Tetriminos respetando las celdas bloqueadas de la fila inferior del tablero.",
                students);
    }

    private void saveActivity(String lessonId, String activityId, String name,
                              ActivityLevel logicLevel, String difficulty, String environment,
                              String missionTitle, String missionObjective, List<User> students) {
        com.pipre.backend.domain.entities.activity.Mission mission =
                com.pipre.backend.domain.entities.activity.Mission.builder()
                        .id(UUID.randomUUID().toString())
                        .title(missionTitle)
                        .objective(missionObjective)
                        .maxBlocks(0)
                        .build();

        Activity activity = Activity.builder()
                .idActivity(activityId)
                .name(name)
                .logicLevel(logicLevel)
                .idLesson(lessonId)
                .complexity(difficulty)
                .difficulty(difficulty)
                .type("robotics")
                .environment(environment)
                .startX(0.0)
                .startZ(0.0)
                .targetX(0.0)
                .targetZ(0.0)
                .missions(List.of(mission))
                .build();
        activityRepositoryPort.save(activity);

        for (int i = 0; i < NUMBER_OF_SIMULATIONS; i++) {
            User randomStudent = faker.options().nextElement(students);
            SimulationResult simResult = faker.options().option(SimulationResult.SUCCESS, SimulationResult.FAILURE);
            simulationRepositoryPort.save(Simulation.builder()
                    .idSimulation(UUID.randomUUID().toString())
                    .result(simResult)
                    .idActivity(activityId)
                    .idStudent(randomStudent.getIdUser())
                    .build());

            resultRepositoryPort.save(com.pipre.backend.domain.entities.result.Result.builder()
                    .idResult(UUID.randomUUID().toString())
                    .attempts(faker.number().numberBetween(1, 5))
                    .errors(faker.number().numberBetween(0, 10))
                    .score(BigDecimal.valueOf(faker.number().randomDouble(2, 50, 100)))
                    .resultSimulation(simResult.name())
                    .idStudent(randomStudent.getIdUser())
                    .idActivity(activityId)
                    .dateAttempted(LocalDateTime.now().minusMinutes(faker.number().numberBetween(1, 120)))
                    .build());
        }
    }
}
