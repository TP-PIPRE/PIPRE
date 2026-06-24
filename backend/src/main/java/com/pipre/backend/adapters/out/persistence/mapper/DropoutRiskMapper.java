package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.DropoutRiskJpaEntity;
import com.pipre.backend.domain.entities.dropoutrisk.DropoutRisk;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DropoutRiskMapper {

    @Mapping(target = "studentJpaEntity", ignore = true)
    DropoutRiskJpaEntity toJpaEntity(DropoutRisk domain);

    @Mapping(target = "idStudent", source = "studentJpaEntity.idUser")
    DropoutRisk toDomain(DropoutRiskJpaEntity entity);
}
