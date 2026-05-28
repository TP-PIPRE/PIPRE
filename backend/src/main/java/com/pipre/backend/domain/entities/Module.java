package com.pipre.backend.domain.entities;

import java.util.List;

public class Module {

    private final String idModule;
    private final String title;
    private final List<String> idLessonList;
    private final String idCourse;

    public Module(Builder builder) {
        this.idModule = builder.idModule;
        this.title = builder.title;
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

    public List<String> getIdLessonList() {
        return this.idLessonList;
    }

    public String getIdCourse() {
        return this.idCourse;
    }

    public static class Builder {
        private String idModule;
        private String title;
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

    }
}
