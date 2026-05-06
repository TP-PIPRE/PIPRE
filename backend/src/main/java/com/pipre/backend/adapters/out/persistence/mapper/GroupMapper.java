package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.GroupJpaEntity;
import com.pipre.backend.domain.entities.Group;

public class GroupMapper {
    public static GroupJpaEntity toJpaEntity(Group domain) {
        if(domain == null) return null;
        return null;
    }

    public static Group toDomain(GroupJpaEntity entity) {
        if (entity == null) return null;
        return null;
    }
}
