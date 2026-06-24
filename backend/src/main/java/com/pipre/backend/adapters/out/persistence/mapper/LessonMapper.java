package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpaEntity;
import com.pipre.backend.domain.entities.lesson.Lesson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.ArrayList;
import java.util.List;

@Mapper(componentModel = "spring")
public interface LessonMapper {

    @Mapping(target = "moduleJpaEntity", ignore = true)
    @Mapping(target = "activityJpaEntityList", ignore = true)
    LessonJpaEntity toJpaEntity(Lesson domain);

    @Mapping(target = "idModule", source = "moduleJpaEntity.idModule")
    @Mapping(target = "idActivityList", source = "activityJpaEntityList")
    Lesson toDomain(LessonJpaEntity entity);

    default List<String> mapActivities(List<ActivityJpaEntity> activities) {
        if (activities == null) {
            return new ArrayList<>();
        }
        return activities.stream()
                .map(ActivityJpaEntity::getIdActivity)
                .toList();
    }
}
