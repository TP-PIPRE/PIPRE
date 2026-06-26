package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RankingJpaEntity;
import com.pipre.backend.domain.entities.ranking.Ranking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RankingMapper {

    @Mapping(target = "groupJpaEntity", ignore = true)
    @Mapping(target = "studentJpaEntity", ignore = true)
    RankingJpaEntity toJpaEntity(Ranking domain);

    @Mapping(target = "idGroup", source = "groupJpaEntity.idGroup")
    @Mapping(target = "idStudent", source = "studentJpaEntity.idUser")
    @Mapping(target = "studentName", expression = "java(entity.getStudentJpaEntity() != null ? entity.getStudentJpaEntity().getFirstName() + \" \" + entity.getStudentJpaEntity().getLastName() : null)")
    @Mapping(target = "level", source = "level")
    @Mapping(target = "xpTotal", source = "xpTotal")
    @Mapping(target = "totalStars", source = "totalStars")
    @Mapping(target = "currentStreak", source = "currentStreak")
    @Mapping(target = "maxStreak", source = "maxStreak")
    Ranking toDomain(RankingJpaEntity entity);
}
