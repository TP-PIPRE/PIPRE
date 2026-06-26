package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.PlayerProfileDTO;
import com.pipre.backend.application.ports.input.GetStudentProfileUseCase;
import com.pipre.backend.application.ports.output.PlayerProfileRepositoryPort;
import com.pipre.backend.application.ports.output.ResultRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.gamification.PlayerProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class GetStudentProfileService implements GetStudentProfileUseCase {
    private final PlayerProfileRepositoryPort playerProfileRepositoryPort;
    private final ResultRepositoryPort resultRepositoryPort;
    private final UserRepositoryPort userRepositoryPort;

    private String resolveUserId(String idOrEmail) {
        if (idOrEmail != null && idOrEmail.contains("@")) {
            return userRepositoryPort.findByEmail(idOrEmail)
                    .map(u -> u.getIdUser())
                    .orElse(idOrEmail);
        }
        return idOrEmail;
    }

    @Override
    public PlayerProfileDTO execute(String idStudent) {
        String resolvedId = resolveUserId(idStudent);
        PlayerProfile profile = playerProfileRepositoryPort.findByIdStudent(resolvedId)
                .orElseGet(() -> PlayerProfile.builder()
                        .idRanking(null)
                        .idStudent(resolvedId)
                        .studentName("Estudiante")
                        .totalPoints(BigDecimal.ZERO)
                        .position(0)
                        .level(1)
                        .xpTotal(0)
                        .totalStars(0)
                        .currentStreak(0)
                        .maxStreak(0)
                        .build());

        var results = resultRepositoryPort.findByIdStudent(resolvedId);

        long challengesCompleted = results.size();
        long totalBlocksUsed = 0;
        double efficiencySum = 0;
        long effCount = 0;

        for (var r : results) {
            if (r.getScore() != null) {
                efficiencySum += r.getScore().doubleValue();
                effCount++;
            }
        }

        double efficiencyAvg = effCount > 0 ? efficiencySum / effCount : 0.0;

        return new PlayerProfileDTO(
                profile.getIdStudent(),
                profile.getStudentName(),
                profile.getTotalPoints(),
                profile.getPosition(),
                profile.getLevel(),
                profile.getXpTotal(),
                profile.getTotalStars(),
                profile.getCurrentStreak(),
                profile.getMaxStreak(),
                (int) challengesCompleted,
                totalBlocksUsed,
                efficiencyAvg
        );
    }
}
