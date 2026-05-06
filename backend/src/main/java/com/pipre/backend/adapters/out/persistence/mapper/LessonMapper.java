package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpaEntity;
import com.pipre.backend.domain.entities.Lesson;

public class LessonMapper {
    public static LessonJpaEntity toJpaEntity(Lesson domain) {
        if(domain == null) return null;
        return null;
    }

    public static Lesson toDomain(LessonJpaEntity entity) {
        if (entity == null) return null;
        return null;
    }
}
