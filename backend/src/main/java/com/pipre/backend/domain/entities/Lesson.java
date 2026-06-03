package com.pipre.backend.domain.entities;

import java.util.List;

public class Lesson {

    private final String idLesson;
    private final String title;
    private final String idModule;
    private final List<String> idActivityList;

    Lesson(String idLesson, String title, String idModule, List<String> idActivityList) {
        this.idLesson = idLesson;
        this.title = title;
        this.idModule = idModule;
        this.idActivityList = idActivityList;
    }

    public static LessonBuilder builder() {
        return new LessonBuilder();
    }

    public String getIdLesson() {
        return this.idLesson;
    }

    public String getTitle() {
        return this.title;
    }

    public String getIdModule() {
        return this.idModule;
    }

    public List<String> getIdActivityList() {
        return this.idActivityList;
    }

    public static class LessonBuilder {
        private String idLesson;
        private String title;
        private String idModule;
        private List<String> idActivityList;

        LessonBuilder() {
        }

        public LessonBuilder idLesson(String idLesson) {
            this.idLesson = idLesson;
            return this;
        }

        public LessonBuilder title(String title) {
            this.title = title;
            return this;
        }

        public LessonBuilder idModule(String idModule) {
            this.idModule = idModule;
            return this;
        }

        public LessonBuilder idActivityList(List<String> idActivityList) {
            this.idActivityList = idActivityList;
            return this;
        }

        public Lesson build() {
            return new Lesson(this.idLesson, this.title, this.idModule, this.idActivityList);
        }

        public String toString() {
            return "Lesson.LessonBuilder(idLesson=" + this.idLesson + ", title=" + this.title + ", idModule=" + this.idModule + ", idActivityList=" + this.idActivityList + ")";
        }
    }
}
