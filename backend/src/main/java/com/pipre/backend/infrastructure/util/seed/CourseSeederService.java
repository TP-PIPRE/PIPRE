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

    private static final int NUMBER_OF_SIMULATIONS = 3;

    @Transactional
    public void seedCourses() {
        List<User> students = userRepositoryPort.findAll().stream()
                .filter(User::getIsActive)
                .toList();

        if (students.isEmpty())
            return;

        // A normal restart must not delete edited courses or their students' results.
        if (courseRepositoryPort.findById("c001").isEmpty()) seedNeonFlowCourse(students);
        else ensureNeonFlowLevels(students);
        if (courseRepositoryPort.findById("c002").isEmpty()) seedTetriLogicCourse(students);
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

        seedNeonFlowActivities(lessonId, students);
    }

    private void ensureNeonFlowLevels(List<User> students) {
        String lessonId = moduleRepositoryPort.findAllByIdCourse("c001").stream()
                .flatMap(module -> lessonRepositoryPort.findAll().stream()
                        .filter(lesson -> module.getIdModule().equals(lesson.getIdModule())))
                .map(com.pipre.backend.domain.entities.lesson.Lesson::getIdLesson)
                .findFirst()
                .orElse(null);
        if (lessonId == null) return;

        seedNeonFlowActivities(lessonId, students);
    }

    private void seedNeonFlowActivities(String lessonId, List<User> students) {
        for (int level = 1; level <= 30; level++) {
            String activityId = "act-c001-" + level;
            if (activityRepositoryPort.findById(activityId).isPresent()) continue;

            ActivityLevel logicLevel = level <= 10
                    ? ActivityLevel.LOW
                    : level <= 20 ? ActivityLevel.MEDIUM : ActivityLevel.HIGH;
            String difficulty = level <= 10 ? "EASY" : level <= 20 ? "MEDIUM" : "HARD";
            String title = neonFlowTitle(level);
            saveActivity(
                    lessonId,
                    activityId,
                    "Neon Flow - Nivel " + level,
                    logicLevel,
                    difficulty,
                    "neonflow",
                    title,
                    neonFlowObjective(level),
                    students);
        }
    }

    private String neonFlowTitle(int level) {
        if (level <= 10) return "Análisis lógico del haz";
        if (level <= 20) return "Reconocimiento de patrones ópticos";
        return "Resolución de problemas multicondición";
    }

    private String neonFlowObjective(int level) {
        if (level <= 10) {
            return "Analiza la trayectoria y aplica condiciones de color para guiar el láser al receptor en un tablero 4x4. Nivel " + level + ".";
        }
        if (level <= 20) {
            return "Reconoce el patrón de obstáculos, planifica los rebotes y guía el láser en un tablero 5x5. Nivel " + level + ".";
        }
        return "Resuelve una ruta óptica compleja combinando espejos y filtros en un tablero 6x6. Nivel " + level + ".";
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
                .description(missionObjective)
                .displayOrder(Integer.parseInt(activityId.substring(activityId.lastIndexOf('-') + 1)))
                .levelTemplate(environment + "-" + activityId.substring(activityId.lastIndexOf('-') + 1))
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
