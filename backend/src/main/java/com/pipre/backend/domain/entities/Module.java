package com.pipre.backend.domain.entities;

import java.math.BigDecimal;
import java.util.List;

public class Module {

    private final String idModule;
    private final String title;
    private final String description;
    private final String difficulty;
    private final Integer moduleOrder;
    private final BigDecimal percentageMeta;
    private final List<String> idLessonList;
    private final String idCourse;

    public Module(Builder builder) {
        this.idModule = builder.idModule;
        this.title = builder.title;
        this.description = builder.description;
        this.difficulty = builder.difficulty;
        this.moduleOrder = builder.moduleOrder;
        this.percentageMeta = builder.percentageMeta;
        this.idLessonList = builder.idLessonList;
        this.idCourse = builder.idCourse;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getIdModule() {
        return this.idModule;
    }

    public String getTitle() {
        return this.title;
    }

    public String getDescription() {
        return this.description;
    }

    public String getDifficulty() {
        return this.difficulty;
    }

    public Integer getModuleOrder() {
        return this.moduleOrder;
    }

    public BigDecimal getPercentageMeta() {
        return this.percentageMeta;
    }

    public List<String> getIdLessonList() {
        return this.idLessonList;
    }

    public String getIdCourse() {
        return this.idCourse;
    }

    public static class Builder {
        private String idModule;
        private String title;
        private String description;
        private String difficulty;
        private Integer moduleOrder;
        private BigDecimal percentageMeta;
        private List<String> idLessonList;
        private String idCourse;

        public Builder() {
        }

        public Builder idModule(String idModule) {
            this.idModule = idModule;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder difficulty(String difficulty) {
            this.difficulty = difficulty;
            return this;
        }

        public Builder moduleOrder(Integer moduleOrder) {
            this.moduleOrder = moduleOrder;
            return this;
        }

        public Builder percentageMeta(BigDecimal percentageMeta) {
            this.percentageMeta = percentageMeta;
            return this;
        }

        public Builder idLessonList(List<String> idLessonList) {
            this.idLessonList = idLessonList;
            return this;
        }

        public Builder idCourse(String idCourse) {
            this.idCourse = idCourse;
            return this;
        }

        public Module build() {
            return new Module(this);
        }

        public String toString() {
            return "Module.ModuleBuilder(idModule=" + this.idModule + ", title=" + this.title + ", description=" + this.description + ", difficulty=" + this.difficulty + ", moduleOrder=" + this.moduleOrder + ", percentageMeta=" + this.percentageMeta + ", idLessonList=" + this.idLessonList + ", idCourse=" + this.idCourse + ")";
        }
    }
}
