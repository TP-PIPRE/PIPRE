package com.pipre.backend.infrastructure.config.seed;

import com.pipre.backend.domain.model.DropoutRisk;
import com.pipre.backend.domain.model.HelpRequest;
import com.pipre.backend.domain.model.User;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.DropoutRiskRepository;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.HelpRequestRepository;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class SupportAnalyticSeederService {

    private final HelpRequestRepository helpRequestRepository;
    private final DropoutRiskRepository dropoutRiskRepository;
    private final UserRepository userRepository;

    private final Random random = new Random();

    @Transactional
    public void seedAnalytics() {
        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("student")))
                .toList();

        if (students.isEmpty()) return;

        for (User student : students) {
            // 1. Simular solicitudes de ayuda (solo para algunos estudiantes)
            if (random.nextDouble() > 0.3) { // El 70% ha pedido ayuda alguna vez
                createFakeHelpRequest(student);
            }

            // 2. Simular análisis de riesgo (para todos los estudiantes)
            createFakeDropoutRisk(student);
        }
    }

    private void createFakeHelpRequest(User student) {
        HelpRequest request = HelpRequest.builder()
                .student(student)
                .timesRequested(random.nextInt(1, 10))
                .aiInteractions(random.nextInt(5, 50))
                .requestedAt(LocalDateTime.now().minusDays(random.nextInt(0, 10)))
                .build();

        helpRequestRepository.save(request);
    }

    private void createFakeDropoutRisk(User student) {
        int daysInactive = random.nextInt(0, 30);
        String riskLevel;
        String performance;
        String motivation;

        // Lógica para que los datos tengan coherencia
        if (daysInactive > 20) {
            riskLevel = "ALTO";
            performance = "BAJO";
            motivation = "CRÍTICA";
        } else if (daysInactive > 7) {
            riskLevel = "MEDIO";
            performance = "REGULAR";
            motivation = "ESTABLE";
        } else {
            riskLevel = "BAJO";
            performance = "EXCELENTE";
            motivation = "ALTA";
        }

        DropoutRisk risk = DropoutRisk.builder()
                .student(student)
                .daysInactive(daysInactive)
                .riskLevel(riskLevel)
                .performance(performance)
                .motivationLevel(motivation)
                .analysisDate(LocalDateTime.now())
                .build();

        dropoutRiskRepository.save(risk);
    }
}
