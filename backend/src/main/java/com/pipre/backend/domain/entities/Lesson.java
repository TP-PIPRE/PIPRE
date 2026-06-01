package com.pipre.backend.domain.entities;

import java.util.List;

public class Lesson {

    private final String idLesson;
    private final String title;
    private final List<String> idActivityList;
    private final String idModule;

    Lesson(String idLesson, String title, List<String> idActivityList, String idModule) {
        this.idLesson = idLesson;
        this.title = title;
        this.idActivityList = idActivityList;
        this.idModule = idModule;
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

    public List<String> getIdActivityList() {
        return this.idActivityList;
    }

    public String getIdModule() {
        return this.idModule;
    }

    public static class LessonBuilder {
        private String idLesson;
        private String title;
        private List<String> idActivityList;
        private String idModule;

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

        public LessonBuilder idActivityList(List<String> idActivityList) {
            this.idActivityList = idActivityList;
            return this;
        }

        public LessonBuilder idModule(String idModule) {
            this.idModule = idModule;
            return this;
        }

        public Lesson build() {
            return new Lesson(this.idLesson, this.title, this.idActivityList, this.idModule);
        }

        public String toString() {
            return "Lesson.LessonBuilder(idLesson=" + this.idLesson + ", title=" + this.title + ", idActivityList=" + this.idActivityList + ", idModule=" + this.idModule + ")";
        }
    }
}
