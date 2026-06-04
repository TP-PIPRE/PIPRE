package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RankingJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.RankingJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.RankingMapper;
import com.pipre.backend.application.ports.output.RankingRepositoryPort;
import com.pipre.backend.domain.entities.Ranking;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RankingRepositoryAdapter implements RankingRepositoryPort {
    private final RankingJpaRepository rankingJpaRepository;

    public List<Ranking> findAllByIdGroup(String idGroup) {
        return rankingJpaRepository.findAllByGroupJpaEntityIdGroupOrderByPositionAsc(idGroup)
                .stream()
                .map(RankingMapper::toDomain)
                .toList();
    }

    @Override
    public void save(Ranking ranking) {
        RankingJpaEntity entity = RankingMapper.toEntity(ranking);
        rankingJpaRepository.save(entity);
    }

    @Override
    public void sortRanking(String idGroup) {
        rankingJpaRepository.sortRanking(idGroup);
    }
}
