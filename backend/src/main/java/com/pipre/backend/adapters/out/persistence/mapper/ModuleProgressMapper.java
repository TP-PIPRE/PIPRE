package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleProgressJpaEntity;
import com.pipre.backend.domain.entities.moduleprogress.ModuleProgress;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ModuleProgressMapper {

    @Mapping(target = "studentJpaEntity", ignore = true)
    @Mapping(target = "moduleJpaEntity", ignore = true)
    ModuleProgressJpaEntity toJpaEntity(ModuleProgress domain);

    @Mapping(target = "idStudent", source = "studentJpaEntity.idUser")
    @Mapping(target = "idModule", source = "moduleJpaEntity.idModule")
    ModuleProgress toDomain(ModuleProgressJpaEntity entity);
}
