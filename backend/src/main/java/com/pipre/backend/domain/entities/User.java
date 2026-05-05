package com.pipre.backend.domain.entities;

import com.pipre.backend.domain.exceptions.BusinessException;

import java.time.LocalDateTime;
import java.util.List;

public class User {
    private final String idUser;
    private final String firstName;
    private final String lastName;
    private final String email;
    private final String passwordHash;
    private final String grade;
    private final Integer age;
    private final Boolean isActive;
    private final LocalDateTime registeredAt;
    private final List<String> roleIdList;

    public User(Builder builder) {
        if (builder.email == null || builder.email.isBlank()) {
            throw new BusinessException("El email del usuario es obligatorio.");
        }

        if (builder.age != null && builder.age < 0) {
            throw new BusinessException("La edad no puede ser negativa.");
        }

        this.idUser = builder.idUser;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.email = builder.email;
        this.passwordHash = builder.passwordHash;
        this.grade = builder.grade;
        this.age = builder.age;
        this.isActive = builder.isActive;
        this.registeredAt = builder.registeredAt;
        this.roleIdList = builder.roleIdList;
    }

    public void addRole(String roleId) {
        if (this.roleIdList.contains(roleId)) {
            throw new BusinessException("El usuario ya tiene asignado este rol");
        }
    }

    public static class Builder {
        private String idUser;
        private String firstName;
        private String lastName;
        private String email;
        private String passwordHash;
        private String grade;
        private Integer age;
        private Boolean isActive;
        private LocalDateTime registeredAt;
        private List<String> roleIdList;

        public Builder idUser(String idUser) {this.idUser = idUser; return this; }
        public Builder firstName(String firstName) {this.firstName = firstName; return this; }
        public Builder lastName(String lastName) {this.lastName = lastName; return this; }
        public Builder email(String email) {this.email = email; return this; }
        public Builder passwordHash(String passwordHash) {this.passwordHash = passwordHash; return this; }
        public Builder grade(String grade) {this.grade = grade; return this; }
        public Builder age(Integer age) {this.age = age; return this; }
        public Builder isActive(Boolean isActive) {this.isActive = isActive; return this; }
        public Builder registeredAt(LocalDateTime registeredAt) {this.registeredAt = registeredAt; return this; }
        public Builder roleIdList(List<String> roleIdList) {this.roleIdList = roleIdList; return this; }

        public User build() {
            return new User(this);
        }
    }

    public String getIdUser() {
        return idUser;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getGrade() {
        return grade;
    }

    public Integer getAge() {
        return age;
    }

    public Boolean getActive() {
        return isActive;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    public List<String> getRoleIdList() {
        return roleIdList;
    }

}
