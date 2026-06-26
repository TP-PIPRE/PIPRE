package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.PlayerAchievementJpaEntity;
import com.pipre.backend.domain.entities.gamification.PlayerAchievement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PlayerAchievementMapper {

    @Mapping(target = "studentJpaEntity", ignore = true)
    @Mapping(target = "achievementJpaEntity", ignore = true)
    PlayerAchievementJpaEntity toJpaEntity(PlayerAchievement domain);

    @Mapping(target = "idStudent", source = "studentJpaEntity.idUser")
    @Mapping(target = "idAchievement", source = "achievementJpaEntity.idAchievement")
    PlayerAchievement toDomain(PlayerAchievementJpaEntity entity);
}
