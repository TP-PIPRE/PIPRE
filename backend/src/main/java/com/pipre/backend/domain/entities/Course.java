package com.pipre.backend.domain.entities;

import java.time.LocalDateTime;
import java.util.List;

public class Course {

    private final String idCourse;
    private final String name;
    private final String description;
    private final String level;
    private final String objective;
    private final LocalDateTime createdAt;
    private final List<String> idModuleList;

    public Course(String idCourse, String name, String description, String level, String objective, LocalDateTime createdAt, List<String> idModuleList) {
        this.idCourse = idCourse;
        this.name = name;
        this.description = description;
        this.level = level;
        this.objective = objective;
        this.createdAt = createdAt;
        this.idModuleList = idModuleList;
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

    public String getObjective() {
        return this.objective;
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
                .objective(this.objective)
                .createdAt(this.createdAt)
                .idModuleList(this.idModuleList);
    }
    public static class Builder {
        private String idCourse;
        private String name;
        private String description;
        private String level;
        private String objective;
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

        public Builder objective(String objective) {
            this.objective = objective;
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
            return new Course(this.idCourse, this.name, this.description, this.level, this.objective, this.createdAt, this.idModuleList);
        }

        public String toString() {
            return "Course.CourseBuilder(idCourse=" + this.idCourse + ", name=" + this.name + ", description=" + this.description + ", level=" + this.level + ", objective=" + this.objective + ", createdAt=" + this.createdAt + ", idModuleList=" + this.idModuleList + ")";
        }
    }
}
