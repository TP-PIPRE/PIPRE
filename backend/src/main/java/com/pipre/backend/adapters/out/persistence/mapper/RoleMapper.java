package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RoleJpaEntity;
import com.pipre.backend.domain.entities.role.Role;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoleMapper {

    RoleJpaEntity toJpaEntity(Role domain);

    Role toDomain(RoleJpaEntity entity);
}
