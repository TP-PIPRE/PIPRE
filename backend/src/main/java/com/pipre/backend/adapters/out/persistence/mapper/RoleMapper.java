package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RoleJpaEntity;
import com.pipre.backend.domain.entities.Role;

public class RoleMapper {
    public static RoleJpaEntity toJpaEntity(Role domain) {
        if (domain == null) return null;
        RoleJpaEntity entity = new RoleJpaEntity();
        entity.setIdRole(domain.getIdRole());
        entity.setName(domain.getName());
        entity.setDescription(domain.getDescription());
        return entity;
    }
    public static Role toDomain(RoleJpaEntity entity) {
        if (entity == null) return null;
        return Role.builder()
                .idRole(entity.getIdRole())
                .name(entity.getName())
                .description(entity.getDescription())
                .build();
    }
}
