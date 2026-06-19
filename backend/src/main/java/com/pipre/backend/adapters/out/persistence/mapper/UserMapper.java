package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RoleJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpaEntity;
import com.pipre.backend.domain.entities.user.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.ArrayList;
import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "roleJpaEntityList", ignore = true)
    @Mapping(target = "isActive", source = "isActive")
    UserJpaEntity toJpaEntity(User domain);

    @Mapping(target = "idRoleList", source = "roleJpaEntityList")
    @Mapping(target = "isActive", source = "isActive")
    User toDomain(UserJpaEntity entity);

    default List<String> mapRoles(List<RoleJpaEntity> roles) {
        if (roles == null) {
            return new ArrayList<>();
        }
        return roles.stream()
                .map(RoleJpaEntity::getIdRole)
                .toList();
    }
}
