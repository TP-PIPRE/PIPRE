package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpaEntity;
import com.pipre.backend.domain.entities.User;

public class UserMapper {
    public static UserJpaEntity toJpaEntity(User domain) {
        if(domain == null) return null;
        UserJpaEntity entity = new UserJpaEntity();

        entity.setIdUser(domain.getIdUser());
        entity.setFirstName(domain.getFirstName());
        entity.setLastName(domain.getLastName());
        entity.setEmail(domain.getEmail());
        entity.setPasswordHash(domain.getPasswordHash());
        entity.setGrade(domain.getGrade());
        entity.setAge(domain.getAge());
        entity.setIsActive(domain.getActive());
        entity.setRegisteredAt(domain.getRegisteredAt());

        return entity;
    }

    public static User toDomain(UserJpaEntity entity) {
        if (entity == null) return null;

        return new User.Builder()
                .idUser(entity.getIdUser())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .email(entity.getEmail())
                .passwordHash(entity.getPasswordHash())
                .grade(entity.getGrade())
                .age(entity.getAge())
                .isActive(entity.getIsActive())
                .registeredAt(entity.getRegisteredAt())
                .build();
    }
}
