package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RankingJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.RankingJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.GroupJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.UserJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.RankingMapper;
import com.pipre.backend.application.ports.output.RankingRepositoryPort;
import com.pipre.backend.domain.entities.ranking.Ranking;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RankingRepositoryAdapter implements RankingRepositoryPort {
    private final RankingJpaRepository rankingJpaRepository;
    private final GroupJpaRepository groupJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final RankingMapper rankingMapper;

    @Override
    @Transactional(readOnly = true)
    public List<Ranking> findAllByIdGroup(String idGroup) {
        return rankingJpaRepository.findAllByGroupJpaEntityIdGroupOrderByPositionAsc(idGroup)
                .stream()
                .map(rankingMapper::toDomain)
                .toList();
    }

    @Override
    public void save(Ranking ranking) {
        RankingJpaEntity entity = rankingMapper.toJpaEntity(ranking);

        if (ranking.getIdGroup() != null) {
            groupJpaRepository.findById(ranking.getIdGroup())
                    .ifPresent(entity::setGroupJpaEntity);
        }

        if (ranking.getIdStudent() != null) {
            userJpaRepository.findById(ranking.getIdStudent())
                    .ifPresent(entity::setStudentJpaEntity);
        }

        rankingJpaRepository.save(entity);
    }

    @Override
    public void sortRanking(String idGroup) {
        rankingJpaRepository.sortRanking(idGroup);
    }

    @Override
    public void deleteByGroupAndStudent(String idGroup, String idStudent) {
        rankingJpaRepository.findAllByGroupJpaEntityIdGroupOrderByPositionAsc(idGroup)
                .stream()
                .filter(r -> idStudent.equals(r.getStudentJpaEntity().getIdUser()))
                .findFirst()
                .ifPresent(rankingJpaRepository::delete);
    }
}
