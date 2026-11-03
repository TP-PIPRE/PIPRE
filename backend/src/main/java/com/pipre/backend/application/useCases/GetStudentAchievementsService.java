package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.AchievementDTO;
import com.pipre.backend.application.ports.input.GetStudentAchievementsUseCase;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.gamification.Achievement;
import com.pipre.backend.domain.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GetStudentAchievementsService implements GetStudentAchievementsUseCase {
    private final AchievementRepositoryPort achievementRepositoryPort;
    private final GamificationRepositoryPort gamificationRepositoryPort;
    private final UserRepositoryPort userRepositoryPort;

    @Override @Transactional(readOnly=true)
    public List<AchievementDTO> execute(String idStudent) {
        var user=idStudent!=null&&idStudent.contains("@")?userRepositoryPort.findByEmail(idStudent):userRepositoryPort.findById(idStudent);
        String id=user.orElseThrow(()->new BusinessException("El estudiante no existe.")).getIdUser();
        var unlocked=gamificationRepositoryPort.unlocks(id).stream().collect(Collectors.toMap(GamificationRepositoryPort.Unlock::achievementId,Function.identity()));
        return achievementRepositoryPort.findAll().stream().filter(Achievement::isActive).sorted(Comparator.comparing(Achievement::getCode))
                .map(a->GamificationService.view(a,unlocked.containsKey(a.getIdAchievement()),unlocked.containsKey(a.getIdAchievement())?unlocked.get(a.getIdAchievement()).unlockedAt():null)).toList();
    }
}
