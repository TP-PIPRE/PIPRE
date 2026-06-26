package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.gamification.PlayerAchievement;
import java.util.List;

public interface PlayerAchievementRepositoryPort {
    List<PlayerAchievement> findByIdStudent(String idStudent);
    boolean existsByIdStudentAndAchievementCode(String idStudent, String code);
    void save(PlayerAchievement playerAchievement);
}
