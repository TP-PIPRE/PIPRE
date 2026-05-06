package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpaEntity;
import com.pipre.backend.domain.entities.Course;

public class CourseMapper {

    public static CourseJpaEntity toJpaEntity(Course domain) {
        if(domain == null) return null;
        return null;
    }

    public static Course toDomain(CourseJpaEntity entity) {
        if (entity == null) return null;
        return null;
    }
}
