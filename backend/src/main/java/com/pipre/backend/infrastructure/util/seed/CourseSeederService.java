package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.adapters.out.persistence.jpaEntities.*;
import com.pipre.backend.adapters.out.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class CourseSeederService {

    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final ActivityRepository activityRepository;
    private final RoboticsSimulationRepository simulationRepository;
    private final UserRepository userRepository;

    private final Faker faker = new Faker();
    private final Random random = new Random();

    @Transactional
    public void seedCourses() {
        // Obtenemos estudiantes existentes para las simulaciones
        List<UserJpa> students = userRepository.findAll().stream()
                .filter(u -> u.getRoleJpas().stream().anyMatch(r -> r.getName().equals("student")))
                .toList();

        if (students.isEmpty()) {
            System.out.println("⚠️ No hay estudiantes para asociar simulaciones.");
            return;
        }

        for (int i = 0; i < 3; i++) { // Crear 3 cursos
            CourseJpa courseJpa = createFakeCourse();

            for (int j = 1; j <= 3; j++) { // 3 módulos por curso
                ModuleJpa moduleJpa = createFakeModule(courseJpa, j);

                for (int k = 1; k <= 2; k++) { // 2 lecciones por módulo
                    LessonJpa lessonJpa = createFakeLesson(moduleJpa);

                    for (int l = 1; l <= 2; l++) { // 2 actividades por lección
                        ActivityJpa activityJpa = createFakeActivity(lessonJpa);

                        // Crear un par de simulaciones por actividad para estudiantes aleatorios
                        for (int s = 0; s < 5; s++) {
                            UserJpa randomStudent = students.get(random.nextInt(students.size()));
                            createFakeSimulation(randomStudent, activityJpa);
                        }
                    }
                }
            }
        }
    }

    private CourseJpa createFakeCourse() {
        CourseJpa courseJpa = CourseJpa.builder()
                .name("Robótica " + faker.job().field())
                .description(faker.lorem().sentence())
                .level(faker.options().option("Básico", "Intermedio", "Avanzado"))
                .objective(faker.lorem().paragraph())
                .createdAt(LocalDateTime.now())
                .build();
        return courseRepository.save(courseJpa);
    }

    private ModuleJpa createFakeModule(CourseJpa courseJpa, int order) {
        ModuleJpa moduleJpa = ModuleJpa.builder()
                .courseJpa(courseJpa)
                .title("Módulo " + order + ": " + faker.educator().course())
                .description(faker.lorem().sentence())
                .difficulty(faker.options().option("Baja", "Media", "Alta"))
                .moduleOrder(order)
                .percentageMeta(BigDecimal.valueOf(random.nextDouble(10, 100)))
                .build();
        return moduleRepository.save(moduleJpa);
    }

    private LessonJpa createFakeLesson(ModuleJpa moduleJpa) {
        LessonJpa lessonJpa = LessonJpa.builder()
                .moduleJpa(moduleJpa)
                .title("Lección: " + faker.book().title())
                .content(faker.lorem().paragraph(5))
                .resourceType(faker.options().option("Video", "PDF", "Interactivo"))
                .build();
        return lessonRepository.save(lessonJpa);
    }

    private ActivityJpa createFakeActivity(LessonJpa lessonJpa) {
        ActivityJpa activityJpa = ActivityJpa.builder()
                .lessonJpa(lessonJpa)
                .name("Reto: " + faker.funnyName().name())
                .complexity(faker.options().option("Simple", "Compuesta"))
                .difficulty(faker.options().option("Fácil", "Normal", "Difícil"))
                .logicLevel(random.nextInt(1, 10))
                .type(faker.options().option("Construcción", "Programación", "Lógica"))
                .build();
        return activityRepository.save(activityJpa);
    }

    private void createFakeSimulation(UserJpa student, ActivityJpa activityJpa) {
        RoboticsSimulationJpa sim = RoboticsSimulationJpa.builder()
                .studentJpa(student)
                .activityJpa(activityJpa)
                .isRandom(random.nextBoolean())
                .blocksUsage(random.nextInt(5, 50))
                .codeUsage(random.nextInt(10, 100))
                .sensorError(BigDecimal.valueOf(random.nextDouble(0, 5)))
                .blocklyCode("<xml>...</xml>")
                .pythonCode("print('Hello Robot')")
                .resolutionTime(random.nextInt(60, 600)) // segundos
                .result(faker.options().option("Éxito", "Fallido", "Incompleto"))
                .date(LocalDateTime.now().minusDays(random.nextInt(1, 30)))
                .build();
        simulationRepository.save(sim);
    }
}
