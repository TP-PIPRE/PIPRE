package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.HelpRequestJpaEntity;
import com.pipre.backend.domain.entities.helprequest.HelpRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface HelpRequestMapper {

    @Mapping(target = "studentJpaEntity", ignore = true)
    @Mapping(target = "timesRequested", ignore = true)
    HelpRequestJpaEntity toJpaEntity(HelpRequest domain);

    @Mapping(target = "idStudent", source = "studentJpaEntity.idUser")
    HelpRequest toDomain(HelpRequestJpaEntity entity);
}
