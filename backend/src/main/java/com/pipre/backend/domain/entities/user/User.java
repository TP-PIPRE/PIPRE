package com.pipre.backend.domain.entities.user;

import com.pipre.backend.domain.exceptions.BusinessException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class User {

    private final String idUser;
    private final String firstName;
    private final String lastName;
    private final Email email;
    private final String passwordHash;
    private final String grade;
    private final Age age;
    private final Boolean isActive;
    private final LocalDateTime registeredAt;
    private final List<String> idRoleList;
    private final Integer failedAttempts;
    private final LocalDateTime lockedUntil;

    public User(Builder builder) {
        this.email = new Email(builder.email);
        this.age = new Age(builder.age);

        this.idUser = builder.idUser;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.passwordHash = builder.passwordHash;
        this.grade = builder.grade;
        this.isActive = builder.isActive;
        this.registeredAt = builder.registeredAt;
        this.failedAttempts = builder.failedAttempts != null ? builder.failedAttempts : 0;
        this.lockedUntil = builder.lockedUntil;
        this.idRoleList = builder.idRoleList != null
                        ? List.copyOf(builder.idRoleList)
                        : List.of();
    }

    public User addRole(String roleId) {
        if (this.idRoleList.contains(roleId)) {
            throw new BusinessException("El usuario ya tiene asignado este rol");
        }
        List<String> updateRoles = new ArrayList<>(this.idRoleList);
        updateRoles.add(roleId);
        return this.toBuilder()
                .idRoleList(updateRoles)
                .build();
    }

    public Builder toBuilder() {
        return new Builder()
                .idUser(this.idUser)
                .firstName(this.firstName)
                .lastName(this.lastName)
                .email(this.getEmail())
                .passwordHash(this.passwordHash)
                .grade(this.grade)
                .age(this.getAge())
                .isActive(this.isActive)
                .registeredAt(this.registeredAt)
                .failedAttempts(this.failedAttempts)
                .lockedUntil(this.lockedUntil)
                .idRoleList(this.idRoleList);
    }

    public static Builder builder() {
        return new Builder();
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
        private List<String> idRoleList;
        private Integer failedAttempts;
        private LocalDateTime lockedUntil;

        public Builder idUser(String idUser) {this.idUser = idUser; return this; }
        public Builder firstName(String firstName) {this.firstName = firstName; return this; }
        public Builder lastName(String lastName) {this.lastName = lastName; return this; }
        public Builder email(String email) {this.email = email; return this; }
        public Builder passwordHash(String passwordHash) {this.passwordHash = passwordHash; return this; }
        public Builder grade(String grade) {this.grade = grade; return this; }
        public Builder age(Integer age) {this.age = age; return this; }
        public Builder isActive(Boolean isActive) {this.isActive = isActive; return this; }
        public Builder registeredAt(LocalDateTime registeredAt) {this.registeredAt = registeredAt; return this; }
        public Builder idRoleList(List<String> idRoleList) {this.idRoleList = idRoleList; return this; }
        public Builder failedAttempts(Integer failedAttempts) {this.failedAttempts = failedAttempts; return this; }
        public Builder lockedUntil(LocalDateTime lockedUntil) {this.lockedUntil = lockedUntil; return this; }

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
        return email != null ? email.value() : null;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getGrade() {
        return grade;
    }

    public Integer getAge() {
        return age != null ? age.value() : null;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    public Integer getFailedAttempts() {
        return failedAttempts;
    }

    public LocalDateTime getLockedUntil() {
        return lockedUntil;
    }

    public List<String> getIdRoleList() {
        return idRoleList;
    }
}
