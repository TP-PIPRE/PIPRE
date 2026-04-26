package com.pipre.backend.infrastructure.util.seed;

import com.pipre.backend.adapters.out.persistence.jpaEntities.DropoutRiskJpa;
import com.pipre.backend.adapters.out.persistence.jpaEntities.HelpRequestJpa;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpa;
import com.pipre.backend.adapters.out.persistence.repository.DropoutRiskRepository;
import com.pipre.backend.adapters.out.persistence.repository.HelpRequestRepository;
import com.pipre.backend.adapters.out.persistence.repository.UserRepository;
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
        List<UserJpa> students = userRepository.findAll().stream()
                .filter(u -> u.getRoleJpas().stream().anyMatch(r -> r.getName().equals("student")))
                .toList();

        if (students.isEmpty()) return;

        for (UserJpa student : students) {
            // 1. Simular solicitudes de ayuda (solo para algunos estudiantes)
            if (random.nextDouble() > 0.3) { // El 70% ha pedido ayuda alguna vez
                createFakeHelpRequest(student);
            }

            // 2. Simular análisis de riesgo (para todos los estudiantes)
            createFakeDropoutRisk(student);
        }
    }

    private void createFakeHelpRequest(UserJpa student) {
        HelpRequestJpa request = HelpRequestJpa.builder()
                .studentJpa(student)
                .timesRequested(random.nextInt(1, 10))
                .aiInteractions(random.nextInt(5, 50))
                .requestedAt(LocalDateTime.now().minusDays(random.nextInt(0, 10)))
                .build();

        helpRequestRepository.save(request);
    }

    private void createFakeDropoutRisk(UserJpa student) {
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

        DropoutRiskJpa risk = DropoutRiskJpa.builder()
                .studentJpa(student)
                .daysInactive(daysInactive)
                .riskLevel(riskLevel)
                .performance(performance)
                .motivationLevel(motivation)
                .analysisDate(LocalDateTime.now())
                .build();

        dropoutRiskRepository.save(risk);
    }
}
