package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.AchievementJpaEntity;
import com.pipre.backend.domain.entities.gamification.Achievement;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AchievementMapper {
    AchievementJpaEntity toJpaEntity(Achievement domain);
    Achievement toDomain(AchievementJpaEntity entity);
}
