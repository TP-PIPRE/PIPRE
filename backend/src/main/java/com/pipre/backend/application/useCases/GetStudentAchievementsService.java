package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.AchievementDTO;
import com.pipre.backend.application.ports.input.GetStudentAchievementsUseCase;
import com.pipre.backend.application.ports.output.AchievementRepositoryPort;
import com.pipre.backend.application.ports.output.PlayerAchievementRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GetStudentAchievementsService implements GetStudentAchievementsUseCase {
    private final AchievementRepositoryPort achievementRepositoryPort;
    private final PlayerAchievementRepositoryPort playerAchievementRepositoryPort;
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
    public List<AchievementDTO> execute(String idStudent) {
        String resolvedId = resolveUserId(idStudent);
        var allAchievements = achievementRepositoryPort.findAll();
        var playerAchievements = playerAchievementRepositoryPort.findByIdStudent(resolvedId);

        Set<String> unlockedIds = playerAchievements.stream()
                .map(pa -> pa.getIdAchievement())
                .collect(Collectors.toSet());

        return allAchievements.stream()
                .map(a -> new AchievementDTO(
                        a.getIdAchievement(),
                        a.getCode(),
                        a.getName(),
                        a.getDescription(),
                        a.getIcon(),
                        a.getCategory(),
                        a.getXpReward(),
                        a.isHidden(),
                        unlockedIds.contains(a.getIdAchievement()),
                        playerAchievements.stream()
                                .filter(pa -> pa.getIdAchievement().equals(a.getIdAchievement()))
                                .findFirst()
                                .map(pa -> pa.getUnlockedAt().toString())
                                .orElse(null)
                ))
                .toList();
    }
}
