package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.PlayerAchievementJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.AchievementJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.PlayerAchievementJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.UserJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.PlayerAchievementMapper;
import com.pipre.backend.application.ports.output.PlayerAchievementRepositoryPort;
import com.pipre.backend.domain.entities.gamification.PlayerAchievement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PlayerAchievementRepositoryAdapter implements PlayerAchievementRepositoryPort {
    private final PlayerAchievementJpaRepository playerAchievementJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final AchievementJpaRepository achievementJpaRepository;
    private final PlayerAchievementMapper playerAchievementMapper;

    @Override
    public List<PlayerAchievement> findByIdStudent(String idStudent) {
        return playerAchievementJpaRepository.findByStudentJpaEntityIdUser(idStudent).stream()
                .map(playerAchievementMapper::toDomain)
                .toList();
    }

    @Override
    public boolean existsByIdStudentAndAchievementCode(String idStudent, String code) {
        return playerAchievementJpaRepository.existsByStudentJpaEntityIdUserAndAchievementJpaEntityCode(idStudent, code);
    }

    @Override
    public void save(PlayerAchievement playerAchievement) {
        PlayerAchievementJpaEntity entity = playerAchievementMapper.toJpaEntity(playerAchievement);
        userJpaRepository.findById(playerAchievement.getIdStudent())
                .ifPresent(entity::setStudentJpaEntity);
        achievementJpaRepository.findById(playerAchievement.getIdAchievement())
                .ifPresent(entity::setAchievementJpaEntity);
        playerAchievementJpaRepository.save(entity);
    }
}
