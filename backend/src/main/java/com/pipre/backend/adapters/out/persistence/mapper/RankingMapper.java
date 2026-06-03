package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.GroupJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.RankingJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpaEntity;
import com.pipre.backend.domain.entities.Ranking;

public class RankingMapper {
    public static Ranking toDomain(RankingJpaEntity entity) {
        if (entity == null) return null;

        String idGroup = (entity.getGroupJpaEntity() == null)
                ? null
                : entity.getGroupJpaEntity().getIdGroup();

        String idStudent = (entity.getStudentJpaEntity() == null)
                ? null
                : entity.getStudentJpaEntity().getIdUser();

        return Ranking.builder()
                .idRanking(entity.getIdRanking())
                .totalPoints(entity.getTotalPoints())
                .position(entity.getPosition())
                .idGroup(idGroup)
                .idStudent(idStudent)
                .build();
    }

    public static RankingJpaEntity toEntity(Ranking domain) {
        if (domain == null) return null;
        RankingJpaEntity entity = new RankingJpaEntity();
        entity.setIdRanking(domain.getIdRanking());
        entity.setTotalPoints(domain.getTotalPoints());
        entity.setPosition(domain.getPosition());

        if (domain.getIdGroup() != null) {
            GroupJpaEntity groupJpaEntity = new GroupJpaEntity();
            groupJpaEntity.setIdGroup(domain.getIdGroup());
            entity.setGroupJpaEntity(groupJpaEntity);
        }
        if (domain.getIdStudent() != null) {
            UserJpaEntity studentEntity = new UserJpaEntity();
            studentEntity.setIdUser(domain.getIdStudent());
            entity.setStudentJpaEntity(studentEntity);
        }

        return entity;
    }
}
