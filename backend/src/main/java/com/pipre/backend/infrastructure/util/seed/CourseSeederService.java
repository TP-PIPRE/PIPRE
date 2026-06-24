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

    private static final List<String> COURSE_NAMES = List.of(
        "Fundamentos de Robótica Educativa",
        "Programación y Algoritmos con Blockly",
        "Sensores y Actuadores en Robots",
        "Lógica de Programación y Control de Flujo",
        "Automatización Básica y Domótica",
        "Robots Móviles y Navegación"
    );

    private static final List<String> MODULE_NAMES = List.of(
        "Introducción a la Lógica Computacional",
        "Estructuras Secuenciales y Repetitivas",
        "Toma de Decisiones y Condicionales",
        "Manejo de Sensores de Proximidad",
        "Control Dinámico de Movimiento",
        "Optimización de Código Visual"
    );

    private static final List<String> LESSON_NAMES = List.of(
        "Primeros Pasos con Bloques",
        "Uso del Bucle Repetir",
        "Lectura del Sensor de Ultrasonido",
        "Decisiones Condicionales Si/Sino",
        "Coordenadas y Posicionamiento del Robot",
        "Evitando Colisiones con Sensores"
    );

    private static final List<String> ACTIVITY_NAMES = List.of(
        "Cruzar la Pista de Obstáculos",
        "Resolver el Laberinto de Paredes",
        "Clasificación de Objetos por Color",
        "Estacionar Robot en Zona Segura",
        "Seguimiento de Línea de Guía",
        "Recorrido Circular de Precisión"
    );

    private static final List<String> MISSION_TITLES = List.of(
        "Misión: Llegar a la meta a salvo",
        "Misión: Recoger muestras del área",
        "Misión: Esquivar los obstáculos",
        "Misión: Encontrar la salida del laberinto",
        "Misión: Posicionar el robot en la base"
    );

    private static final List<String> MISSION_OBJECTIVES = List.of(
        "Programa el robot para avanzar 30 unidades y detenerse sin chocar.",
        "Utiliza el sensor de ultrasonido para evadir los muros del laberinto.",
        "Lee los datos de los sensores de suelo para seguir la trayectoria.",
        "Recoge todas las muestras esparcidas y vuelve al punto de inicio.",
        "Llega a las coordenadas de destino usando el menor número de bloques."
    );

    @Transactional
    public void seedCourses() {
        List<User> students = userRepositoryPort.findAll().stream()
                .filter(User::getIsActive)
                .toList();

        if (students.isEmpty())
            return;

        int NUMBER_OF_COURSES = 5;
        int NUMBER_OF_MODULES = 3;
        int NUMBER_OF_LESSONS = 3;
        int NUMBER_OF_ACTIVITIES = 3;
        int NUMBER_OF_SIMULATIONS = 3;

        for (int i = 0; i < NUMBER_OF_COURSES; i++) {
            String courseName = COURSE_NAMES.get(i % COURSE_NAMES.size());
            Course course = Course.builder()
                    .idCourse(UUID.randomUUID().toString())
                    .name(courseName)
                    .description("Curso completo enfocado en " + courseName.toLowerCase() + ".")
                    .level(faker.options().option(CourseLevel.LOW, CourseLevel.MEDIUM, CourseLevel.HIGH))
                    .createdAt(LocalDateTime.now().minusDays(faker.number().numberBetween(1, 120)))
                    .build();
            courseRepositoryPort.save(course);
            String courseId = course.getIdCourse();

            for (int j = 1; j <= NUMBER_OF_MODULES; j++) {
                String moduleTitle = MODULE_NAMES.get((i + j) % MODULE_NAMES.size());
                Module module = Module.builder()
                        .idModule(UUID.randomUUID().toString())
                        .title("Módulo: " + moduleTitle)
                        .idCourse(courseId)
                        .build();
                moduleRepositoryPort.save(module);
                String moduleId = module.getIdModule();

                for (int k = 1; k <= NUMBER_OF_LESSONS; k++) {
                    String lessonTitle = LESSON_NAMES.get((i + j + k) % LESSON_NAMES.size());
                    Lesson lesson = Lesson.builder()
                            .idLesson(UUID.randomUUID().toString())
                            .title("Lección: " + lessonTitle)
                            .idModule(moduleId)
                            .build();
                    lessonRepositoryPort.save(lesson);
                    String lessonId = lesson.getIdLesson();

                    for (int l = 1; l <= NUMBER_OF_ACTIVITIES; l++) {
                        String idActivity = UUID.randomUUID().toString();
                        int idx = (i + j + k + l);
                        com.pipre.backend.domain.entities.activity.Mission mission = com.pipre.backend.domain.entities.activity.Mission.builder()
                                .id(UUID.randomUUID().toString())
                                .title(MISSION_TITLES.get(idx % MISSION_TITLES.size()))
                                .objective(MISSION_OBJECTIVES.get(idx % MISSION_OBJECTIVES.size()))
                                .maxBlocks(faker.number().numberBetween(5, 20))
                                .build();

                        String activityName = ACTIVITY_NAMES.get(idx % ACTIVITY_NAMES.size());
                        Activity activity = Activity.builder()
                                .idActivity(idActivity)
                                .name(activityName)
                                .logicLevel(faker.options().option(ActivityLevel.LOW, ActivityLevel.MEDIUM, ActivityLevel.HIGH))
                                .idLesson(lessonId)
                                .complexity(faker.options().option("EASY", "MEDIUM", "HARD"))
                                .difficulty(faker.options().option("EASY", "MEDIUM", "HARD"))
                                .type(faker.options().option("robotics", "theoretical", "quiz"))
                                .environment(faker.options().option("obstacle", "maze", "battle", "space"))
                                .startX(0.0)
                                .startZ(0.0)
                                .targetX(faker.number().randomDouble(1, 10, 50))
                                .targetZ(faker.number().randomDouble(1, 10, 50))
                                .missions(List.of(mission))
                                .build();
                        activityRepositoryPort.save(activity);

                        for (int m = 1; m <= NUMBER_OF_SIMULATIONS; m++) {
                            User randomStudent = faker.options().nextElement(students);
                            SimulationResult simResult = faker.options().option(SimulationResult.SUCCESS, SimulationResult.FAILURE);
                            Simulation simulation = Simulation.builder()
                                    .idSimulation(UUID.randomUUID().toString())
                                    .result(simResult)
                                    .idActivity(idActivity)
                                    .idStudent(randomStudent.getIdUser())
                                    .build();
                            simulationRepositoryPort.save(simulation);

                            com.pipre.backend.domain.entities.result.Result result = com.pipre.backend.domain.entities.result.Result.builder()
                                    .idResult(UUID.randomUUID().toString())
                                    .attempts(faker.number().numberBetween(1, 5))
                                    .errors(faker.number().numberBetween(0, 10))
                                    .score(BigDecimal.valueOf(faker.number().randomDouble(2, 50, 100)))
                                    .resultSimulation(simResult.name())
                                    .idStudent(randomStudent.getIdUser())
                                    .idActivity(idActivity)
                                    .dateAttempted(LocalDateTime.now().minusMinutes(faker.number().numberBetween(1, 120)))
                                    .build();
                            resultRepositoryPort.save(result);
                        }
                    }
                }
            }
        }
    }
}