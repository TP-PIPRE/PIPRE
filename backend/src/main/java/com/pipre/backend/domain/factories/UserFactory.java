package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class UserFactory {
    public static User createNewUser(
            String firstName, String lastName, String email,
            String passwordHash, String grade, Integer age,
            List<String> idRoleList) {
        return new User.Builder()
                .idUser(UUID.randomUUID().toString())
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .passwordHash(passwordHash)
                .grade(grade)
                .age(age)
                .isActive(true)
                .registeredAt(LocalDateTime.now())
                .idRoleList(idRoleList)
                .build();
    }
}
