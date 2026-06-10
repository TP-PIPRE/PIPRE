package com.pipre.backend.domain.entities.lesson;

import com.pipre.backend.domain.exceptions.BusinessException;
import java.util.List;

public class Lesson {

    private final String idLesson;
    private final String title;
    private final String idModule;
    private final List<String> idActivityList;

    Lesson(String idLesson, String title, String idModule, List<String> idActivityList) {
        if (idLesson == null || idLesson.isBlank()) {
            throw new BusinessException("El ID de la lección es obligatorio.");
        }
        if (title == null || title.isBlank()) {
            throw new BusinessException("El título de la lección es obligatorio.");
        }
        if (idModule == null || idModule.isBlank()) {
            throw new BusinessException("El ID del módulo es obligatorio.");
        }
        this.idLesson = idLesson;
        this.title = title;
        this.idModule = idModule;
        this.idActivityList = idActivityList != null ? List.copyOf(idActivityList) : List.of();
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
