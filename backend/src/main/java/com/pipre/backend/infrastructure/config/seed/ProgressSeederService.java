package com.pipre.backend.infrastructure.config.seed;

import com.pipre.backend.domain.model.Activity;
import com.pipre.backend.domain.model.ActivityResult;
import com.pipre.backend.domain.model.ModuleProgress;
import com.pipre.backend.domain.model.User;
import com.pipre.backend.domain.model.Module;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.*;
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
        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("student")))
                .toList();

        List<Activity> activities = activityRepository.findAll();
        List<Module> modules = moduleRepository.findAll();

        if (students.isEmpty() || activities.isEmpty() || modules.isEmpty()) {
            System.out.println("⚠️ Faltan datos base (estudiantes, actividades o módulos) para sembrar progreso.");
            return;
        }

        for (User student : students) {
            // 2. Generar resultados de actividades (Métricas de desempeño)
            // Hacemos que cada estudiante haya completado algunas actividades al azar
            List<Activity> randomActivities = new ArrayList<>(activities);
            Collections.shuffle(randomActivities);

            for (int i = 0; i < random.nextInt(5, 10); i++) {
                Activity activity = randomActivities.get(i);
                createFakeActivityResult(student, activity);
            }

            // 3. Generar progreso de módulos
            // Para cada estudiante, asignamos progreso en los módulos disponibles
            for (Module module : modules) {
                createFakeModuleProgress(student, module);
            }
        }
    }

    private void createFakeActivityResult(User student, Activity activity) {
        int attempts = random.nextInt(1, 5);
        int errors = random.nextInt(0, attempts * 2);
        double score = 60 + (random.nextDouble() * 40); // Puntaje entre 60 y 100

        ActivityResult result = ActivityResult.builder()
                .student(student)
                .activity(activity)
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

    private void createFakeModuleProgress(User student, Module module) {
        double percentage = random.nextDouble() * 100;
        String status;

        if (percentage == 0) status = "NOT_STARTED";
        else if (percentage < 100) status = "IN_PROGRESS";
        else status = "COMPLETED";

        ModuleProgress progress = ModuleProgress.builder()
                .student(student)
                .module(module)
                .percentage(BigDecimal.valueOf(percentage).setScale(2, RoundingMode.HALF_UP))
                .status(status)
                .updatedAt(LocalDateTime.now().minusHours(random.nextInt(1, 72)))
                .build();

        moduleProgressRepository.save(progress);
    }
}
