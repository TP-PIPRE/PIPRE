package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.GroupJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.RankingJpaEntity;
import com.pipre.backend.domain.entities.group.Group;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.ArrayList;
import java.util.List;

@Mapper(componentModel = "spring")
public interface GroupMapper {

    @Mapping(target = "rankingJpaEntityList", ignore = true)
    GroupJpaEntity toJpaEntity(Group domain);

    @Mapping(target = "idGroupStudentList", source = "rankingJpaEntityList")
    Group toDomain(GroupJpaEntity entity);

    default List<String> mapRankings(List<RankingJpaEntity> rankings) {
        if (rankings == null) {
            return new ArrayList<>();
        }
        return rankings.stream()
                .map(RankingJpaEntity::getIdRanking)
                .toList();
    }
}
