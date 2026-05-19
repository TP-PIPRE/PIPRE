package com.pipre.backend.domain.entities;

import java.util.List;

public class Lesson {

    private final String idLesson;
    private final String title;
    private final List<String> idActivityList;
    private final String idModule;

    public Lesson(Builder builder) {
        this.idLesson = builder.idLesson;
        this.title = builder.title;
        this.idActivityList = builder.idActivityList;
        this.idModule = builder.idModule;
    }

    public String getIdLesson() {
        return this.idLesson;
    }

    public String getTitle() {
        return this.title;
    }

    public List<String> getIdActivityList() {
        return this.idActivityList;
    }

    public String getIdModule() {
        return this.idModule;
    }

    public static class Builder {
        private String idLesson;
        private String title;
        private List<String> idActivityList;
        private String idModule;

        public Builder idLesson(String idLesson) {
            this.idLesson = idLesson;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder idActivityList(List<String> idActivityList) {
            this.idActivityList = idActivityList;
            return this;
        }

        public Builder idModule(String idModule) {
            this.idModule = idModule;
            return this;
        }

        public Lesson build() {
            return new Lesson(this);
        }

    }
}
