package com.pipre.backend.domain.entities;

import java.time.LocalDateTime;
import java.util.List;

public class Course {

    private final String idCourse;
    private final String name;
    private final String description;
    private final String level;
    private final LocalDateTime createdAt;
    private final List<String> idModuleList;

    public Course(Builder builder) {
        this.idCourse = builder.idCourse;
        this.name = builder.name;
        this.description = builder.description;
        this.level = builder.level;
        this.createdAt = builder.createdAt;
        this.idModuleList = builder.idModuleList;
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

    public String getLevel() {
        return this.level;
    }

    public LocalDateTime getCreatedAt() {
        return this.createdAt;
    }

    public List<String> getIdModuleList() {
        return this.idModuleList;
    }

    public Course updateCourse(String name, String description, String level) {
        return this.toBuilder()
                .name(name)
                .description(description)
                .level(level)
                .build();
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
        private String level;
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

        public Builder level(String level) {
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
