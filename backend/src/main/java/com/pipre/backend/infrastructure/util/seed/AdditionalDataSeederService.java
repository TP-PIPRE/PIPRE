package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.helprequest.HelpRequest;
import com.pipre.backend.domain.entities.moduleprogress.ModuleProgress;
import com.pipre.backend.domain.entities.dropoutrisk.DropoutRisk;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.entities.module.Module;
import com.pipre.backend.domain.entities.course.Course;

import lombok.RequiredArgsConstructor;
import net.datafaker.Faker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AdditionalDataSeederService {

    private final Faker faker = new Faker();
    private final UserRepositoryPort userRepositoryPort;
    private final CourseRepositoryPort courseRepositoryPort;
    private final ModuleRepositoryPort moduleRepositoryPort;
    private final HelpRequestRepositoryPort helpRequestRepositoryPort;
    private final ModuleProgressRepositoryPort moduleProgressRepositoryPort;
    private final DropoutRiskRepositoryPort dropoutRiskRepositoryPort;

    @Transactional
    public void seedAdditionalData() {
        List<User> students = userRepositoryPort.findAll().stream()
                .filter(User::getIsActive)
                .toList();

        if (students.isEmpty()) {
            return;
        }

        List<Course> courses = courseRepositoryPort.findAll();
        List<Module> modules = courses.stream()
                .flatMap(course -> moduleRepositoryPort.findAllByIdCourse(course.getIdCourse()).stream())
                .toList();

        if (modules.isEmpty()) {
            return;
        }

        int NUMBER_OF_HELP_REQUESTS = 10;
        int NUMBER_OF_MODULE_PROGRESS = 15;
        int NUMBER_OF_DROPOUT_RISKS = 8;

        // Seed Help Requests
        for (int i = 0; i < NUMBER_OF_HELP_REQUESTS; i++) {
            User student = faker.options().nextElement(students);
            HelpRequest hr = HelpRequest.builder()
                    .idHelpRequest(UUID.randomUUID().toString())
                    .aiInteractions(faker.number().numberBetween(1, 10))
                    .requestedAt(LocalDateTime.now().minusDays(faker.number().numberBetween(1, 30)))
                    .idStudent(student.getIdUser())
                    .build();
            helpRequestRepositoryPort.save(hr);
        }

        // Seed Module Progress
        for (int i = 0; i < NUMBER_OF_MODULE_PROGRESS; i++) {
            User student = faker.options().nextElement(students);
            Module module = faker.options().nextElement(modules);
            BigDecimal percentage = BigDecimal.valueOf(ThreadLocalRandom.current().nextDouble(0.0, 100.0));
            String status = percentage.compareTo(BigDecimal.valueOf(100.0)) == 0 ? "COMPLETED" : "IN_PROGRESS";
            
            ModuleProgress mp = ModuleProgress.builder()
                    .idProgress(UUID.randomUUID().toString())
                    .percentage(percentage)
                    .status(status)
                    .updatedAt(LocalDateTime.now().minusDays(faker.number().numberBetween(1, 15)))
                    .idStudent(student.getIdUser())
                    .idModule(module.getIdModule())
                    .build();
            moduleProgressRepositoryPort.save(mp);
        }

        // Seed Dropout Risks
        for (int i = 0; i < NUMBER_OF_DROPOUT_RISKS; i++) {
            User student = faker.options().nextElement(students);
            String riskLevel = faker.options().option("LOW", "MEDIUM", "HIGH");
            String motivationLevel = faker.options().option("LOW", "MEDIUM", "HIGH");
            String performance = faker.options().option("EXCELLENT", "GOOD", "REGULAR", "POOR");
            
            DropoutRisk dr = DropoutRisk.builder()
                    .idRisk(UUID.randomUUID().toString())
                    .daysInactive(faker.number().numberBetween(0, 30))
                    .performance(performance)
                    .riskLevel(riskLevel)
                    .motivationLevel(motivationLevel)
                    .analysisDate(LocalDateTime.now().minusDays(faker.number().numberBetween(0, 5)))
                    .idStudent(student.getIdUser())
                    .build();
            dropoutRiskRepositoryPort.save(dr);
        }
    }
}
