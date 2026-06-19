package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleJpaEntity;
import com.pipre.backend.domain.entities.course.Course;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CourseMapper {

    @Mapping(target = "moduleJpaEntityList", ignore = true)
    CourseJpaEntity toJpaEntity(Course domain);

    @Mapping(target = "idModuleList", source = "moduleJpaEntityList")
    Course toDomain(CourseJpaEntity entity);

    default String mapModuleToString(ModuleJpaEntity module) {
        if (module == null) {
            return null;
        }
        return module.getIdModule();
    }
}
