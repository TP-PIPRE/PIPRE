package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaRepositories.RankingJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.ResultJpaRepository;
import com.pipre.backend.application.ports.output.PlayerProfileRepositoryPort;
import com.pipre.backend.domain.entities.gamification.PlayerProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PlayerProfileRepositoryAdapter implements PlayerProfileRepositoryPort {
    private final RankingJpaRepository rankingJpaRepository;
    private final ResultJpaRepository resultJpaRepository;

    @Override
    public Optional<PlayerProfile> findByIdStudent(String idStudent) {
        return rankingJpaRepository.findByStudentJpaEntityIdUser(idStudent)
                .map(entity -> {
                    long completedCount = resultJpaRepository.countByStudentJpaEntityIdUser(idStudent);
                    long totalBlocks = 0; // Calculated from simulations
                    Double efficiencyAvg = 0.0;
                    return PlayerProfile.builder()
                            .idRanking(entity.getIdRanking())
                            .idStudent(entity.getStudentJpaEntity().getIdUser())
                            .studentName(entity.getStudentJpaEntity().getFirstName() + " " + entity.getStudentJpaEntity().getLastName())
                            .totalPoints(entity.getTotalPoints())
                            .position(entity.getPosition())
                            .level(entity.getLevel() != null ? entity.getLevel() : 1)
                            .xpTotal(entity.getXpTotal() != null ? entity.getXpTotal() : 0)
                            .totalStars(entity.getTotalStars() != null ? entity.getTotalStars() : 0)
                            .currentStreak(entity.getCurrentStreak() != null ? entity.getCurrentStreak() : 0)
                            .maxStreak(entity.getMaxStreak() != null ? entity.getMaxStreak() : 0)
                            .updatedAt(entity.getUpdatedAt())
                            .build();
                });
    }
}
