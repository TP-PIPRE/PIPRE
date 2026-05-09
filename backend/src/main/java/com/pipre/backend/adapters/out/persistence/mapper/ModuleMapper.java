package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleJpaEntity;
import com.pipre.backend.domain.entities.Module;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ModuleMapper {
    public static ModuleJpaEntity toJpaEntity(Module domain) {
        if (domain == null) return null;
        ModuleJpaEntity entity = new ModuleJpaEntity();
        entity.setIdModule(domain.getIdModule());
        entity.setTitle(domain.getTitle());
        entity.setDescription(domain.getDescription());
        entity.setIsAvailable(domain.getIsAvailable());
        entity.setModuleOrder(domain.getModuleOrder());
        entity.setPercentageMeta(domain.getPercentageMeta());
        return entity;
    }
    public static Module toDomain(ModuleJpaEntity entity) {
        if (entity == null) return null;

        String idCourse = (entity.getCourseJpaEntity() == null)
                ? null
                : entity.getCourseJpaEntity().getIdCourse();
        List<String> idLessonList = (entity.getLessonJpaEntityList() == null)
                ? new ArrayList<>()
                : entity.getLessonJpaEntityList()
                        .stream()
                        .map(LessonJpaEntity::getIdLesson)
                        .collect(Collectors.toList());

        return new Module.Builder()
                .idModule(entity.getIdModule())
                .idCourse(idCourse)
                .title(entity.getTitle())
                .description(entity.getDescription())
                .isAvailable(entity.getIsAvailable())
                .moduleOrder(entity.getModuleOrder())
                .percentageMeta(entity.getPercentageMeta())
                .idLessonList(idLessonList)
                .build();
    }
}
