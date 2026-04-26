package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.adapters.out.persistence.jpaEntities.*;
import com.pipre.backend.adapters.out.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class ProgressSeederService {

    private final ActivityResultRepository activityResultRepository;
    private final ModuleProgressRepository moduleProgressRepository;
    private final UserRepository userRepository;
    private final ActivityRepository activityRepository;
    private final ModuleRepository moduleRepository;

    private final Random random = new Random();

    @Transactional
    public void seedProgress() {
        // 1. Obtener los actores necesarios
        List<UserJpa> students = userRepository.findAll().stream()
                .filter(u -> u.getRoleJpas().stream().anyMatch(r -> r.getName().equals("student")))
                .toList();

        List<ActivityJpa> activities = activityRepository.findAll();
        List<ModuleJpa> moduleJpas = moduleRepository.findAll();

        if (students.isEmpty() || activities.isEmpty() || moduleJpas.isEmpty()) {
            System.out.println("⚠️ Faltan datos base (estudiantes, actividades o módulos) para sembrar progreso.");
            return;
        }

        for (UserJpa student : students) {
            // 2. Generar resultados de actividades (Métricas de desempeño)
            // Hacemos que cada estudiante haya completado algunas actividades al azar
            List<ActivityJpa> randomActivities = new ArrayList<>(activities);
            Collections.shuffle(randomActivities);

            for (int i = 0; i < random.nextInt(5, 10); i++) {
                ActivityJpa activityJpa = randomActivities.get(i);
                createFakeActivityResult(student, activityJpa);
            }

            // 3. Generar progreso de módulos
            // Para cada estudiante, asignamos progreso en los módulos disponibles
            for (ModuleJpa moduleJpa : moduleJpas) {
                createFakeModuleProgress(student, moduleJpa);
            }
        }
    }

    private void createFakeActivityResult(UserJpa student, ActivityJpa activityJpa) {
        int attempts = random.nextInt(1, 5);
        int errors = random.nextInt(0, attempts * 2);
        double score = 60 + (random.nextDouble() * 40); // Puntaje entre 60 y 100

        ActivityResultJpa result = ActivityResultJpa.builder()
                .studentJpa(student)
                .activityJpa(activityJpa)
                .attempts(attempts)
                .errors(errors)
                .score(BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP))
                .doneCount(random.nextInt(1, 3))
                .successRate(BigDecimal.valueOf((1.0 - ((double) errors / (errors + attempts + 1))) * 100)
                        .setScale(2, RoundingMode.HALF_UP))
                .date(LocalDateTime.now().minusDays(random.nextInt(0, 15)))
                .build();

        activityResultRepository.save(result);
    }

    private void createFakeModuleProgress(UserJpa student, ModuleJpa moduleJpa) {
        double percentage = random.nextDouble() * 100;
        String status;

        if (percentage == 0) status = "NOT_STARTED";
        else if (percentage < 100) status = "IN_PROGRESS";
        else status = "COMPLETED";

        ModuleProgressJpa progress = ModuleProgressJpa.builder()
                .studentJpa(student)
                .moduleJpa(moduleJpa)
                .percentage(BigDecimal.valueOf(percentage).setScale(2, RoundingMode.HALF_UP))
                .status(status)
                .updatedAt(LocalDateTime.now().minusHours(random.nextInt(1, 72)))
                .build();

        moduleProgressRepository.save(progress);
    }
}
