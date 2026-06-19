package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleJpaEntity;
import com.pipre.backend.domain.entities.module.Module;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.ArrayList;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ModuleMapper {

    @Mapping(target = "courseJpaEntity", ignore = true)
    @Mapping(target = "lessonJpaEntityList", ignore = true)
    ModuleJpaEntity toJpaEntity(Module domain);

    @Mapping(target = "idCourse", source = "courseJpaEntity.idCourse")
    @Mapping(target = "idLessonList", source = "lessonJpaEntityList")
    Module toDomain(ModuleJpaEntity entity);

    default List<String> mapLessons(List<LessonJpaEntity> lessons) {
        if (lessons == null) {
            return new ArrayList<>();
        }
        return lessons.stream()
                .map(LessonJpaEntity::getIdLesson)
                .toList();
    }
}
