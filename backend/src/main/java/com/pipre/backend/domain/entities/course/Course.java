package com.pipre.backend.domain.entities.course;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class Course {

    private final String idCourse;
    private final String name;
    private final String description;
    private final CourseLevel level;
    private final LocalDateTime createdAt;
    private final List<String> idModuleList;

    public Course(Builder builder) {
        this.idCourse = validateNotEmpty(builder.idCourse, "El ID del curso no puede estar vacío");
        this.name = validateNotEmpty(builder.name, "El nombre del curso no puede estar vacío");
        this.description = builder.description;
        this.level = Objects.requireNonNull(builder.level, "El nivel del curso no puede ser nulo");
        this.createdAt = Objects.requireNonNull(builder.createdAt, "La fecha de creación no puede ser nula");
        this.idModuleList = builder.idModuleList != null ? new ArrayList<>(builder.idModuleList) : new ArrayList<>();
    }

    private String validateNotEmpty(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(message);
        }
        return value;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getIdCourse() {
        return this.idCourse;
    }

    public String getName() {
        return this.name;
    }

    public String getDescription() {
        return this.description;
    }

    public CourseLevel getLevel() {
        return this.level;
    }

    public LocalDateTime getCreatedAt() {
        return this.createdAt;
    }

    public List<String> getIdModuleList() {
        return Collections.unmodifiableList(this.idModuleList);
    }

    public Course changeDetails(String name, String description, CourseLevel level) {
        return this.toBuilder()
                .name(name)
                .description(description)
                .level(level)
                .build();
    }

    public void assignModule(String idModule) {
        if (idModule == null || idModule.trim().isEmpty()) {
            throw new IllegalArgumentException("El ID del módulo no puede ser nulo o vacío");
        }
        if (this.idModuleList.contains(idModule)) {
            throw new IllegalArgumentException("El módulo ya está asignado a este curso");
        }
        this.idModuleList.add(idModule);
    }

    public void removeModule(String idModule) {
        if (idModule == null || idModule.trim().isEmpty()) {
            throw new IllegalArgumentException("El ID del módulo no puede ser nulo o vacío");
        }
        if (!this.idModuleList.contains(idModule)) {
            throw new IllegalArgumentException("El módulo no está asignado a este curso");
        }
        this.idModuleList.remove(idModule);
    }

    public Builder toBuilder() {
        return new Builder()
                .idCourse(this.idCourse)
                .name(this.name)
                .description(this.description)
                .level(this.level)
                .createdAt(this.createdAt)
                .idModuleList(this.idModuleList);
    }

    public static class Builder {
        private String idCourse;
        private String name;
        private String description;
        private CourseLevel level;
        private LocalDateTime createdAt;
        private List<String> idModuleList;

        public Builder() {
        }

        public Builder idCourse(String idCourse) {
            this.idCourse = idCourse;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder level(CourseLevel level) {
            this.level = level;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder idModuleList(List<String> idModuleList) {
            this.idModuleList = idModuleList;
            return this;
        }

        public Course build() {
            return new Course(this);
        }
    }
}
