package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleJpaEntity;
import com.pipre.backend.domain.entities.Course;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class CourseMapper {

    public static CourseJpaEntity toJpaEntity(Course domain) {
        if(domain == null) return null;

        CourseJpaEntity entity = new CourseJpaEntity();
        entity.setIdCourse(domain.getIdCourse());
        entity.setName(domain.getName());
        entity.setDescription(domain.getDescription());
        entity.setLevel(domain.getLevel());
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }

    public static Course toDomain(CourseJpaEntity entity) {
        if (entity == null) return null;

        List<String> idModuleList = (entity.getModuleJpaEntityList() == null)
                ? new ArrayList<>()
                : entity.getModuleJpaEntityList()
                        .stream()
                        .map(ModuleJpaEntity::getIdModule)
                        .collect(Collectors.toList());

        return new Course.Builder()
                .idCourse(entity.getIdCourse())
                .name(entity.getName())
                .description(entity.getDescription())
                .level(entity.getLevel())
                .createdAt(entity.getCreatedAt())
                .idModuleList(idModuleList)
                .build();
    }
}
