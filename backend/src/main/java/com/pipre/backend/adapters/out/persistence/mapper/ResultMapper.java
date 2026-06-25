package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ResultJpaEntity;
import com.pipre.backend.domain.entities.result.Result;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ResultMapper {

    @Mapping(target = "studentJpaEntity", ignore = true)
    @Mapping(target = "activityJpaEntity", ignore = true)
    ResultJpaEntity toJpaEntity(Result domain);

    @Mapping(target = "idStudent", source = "studentJpaEntity.idUser")
    @Mapping(target = "idActivity", source = "activityJpaEntity.idActivity")
    Result toDomain(ResultJpaEntity entity);
}
