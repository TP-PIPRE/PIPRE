package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.gamification.Achievement;
import java.util.List;
import java.util.Optional;

public interface AchievementRepositoryPort {
    List<Achievement> findAll();
    Optional<Achievement> findById(String idAchievement);
    Optional<Achievement> findByCode(String code);
}
