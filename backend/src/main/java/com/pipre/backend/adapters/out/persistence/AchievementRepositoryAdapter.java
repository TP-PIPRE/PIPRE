package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaRepositories.AchievementJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.AchievementMapper;
import com.pipre.backend.application.ports.output.AchievementRepositoryPort;
import com.pipre.backend.domain.entities.gamification.Achievement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AchievementRepositoryAdapter implements AchievementRepositoryPort {
    private final AchievementJpaRepository achievementJpaRepository;
    private final AchievementMapper achievementMapper;

    @Override
    public List<Achievement> findAll() {
        return achievementJpaRepository.findAll().stream()
                .map(achievementMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<Achievement> findById(String idAchievement) {
        return achievementJpaRepository.findById(idAchievement)
                .map(achievementMapper::toDomain);
    }

    @Override
    public Optional<Achievement> findByCode(String code) {
        return achievementJpaRepository.findByCode(code)
                .map(achievementMapper::toDomain);
    }
}
