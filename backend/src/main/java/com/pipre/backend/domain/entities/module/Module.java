package com.pipre.backend.domain.entities.module;

import com.pipre.backend.domain.exceptions.BusinessException;
import java.util.List;

public class Module {

    private final String idModule;
    private final String title;
    private final String idCourse;
    private final List<String> idLessonList;

    Module(String idModule, String title, String idCourse, List<String> idLessonList) {
        if (idModule == null || idModule.isBlank()) {
            throw new BusinessException("El ID del módulo es obligatorio.");
        }
        if (title == null || title.isBlank()) {
            throw new BusinessException("El título del módulo es obligatorio.");
        }
        if (idCourse == null || idCourse.isBlank()) {
            throw new BusinessException("El ID del curso es obligatorio.");
        }
        this.idModule = idModule;
        this.title = title;
        this.idCourse = idCourse;
        this.idLessonList = idLessonList != null ? List.copyOf(idLessonList) : List.of();
    }

    public static ModuleBuilder builder() {
        return new ModuleBuilder();
    }

    public String getIdModule() {
        return this.idModule;
    }

    public String getTitle() {
        return this.title;
    }

    public String getIdCourse() {
        return this.idCourse;
    }

    public List<String> getIdLessonList() {
        return this.idLessonList;
    }

    public static class ModuleBuilder {
        private String idModule;
        private String title;
        private String idCourse;
        private List<String> idLessonList;

        ModuleBuilder() {
        }

        public ModuleBuilder idModule(String idModule) {
            this.idModule = idModule;
            return this;
        }

        public ModuleBuilder title(String title) {
            this.title = title;
            return this;
        }

        public ModuleBuilder idCourse(String idCourse) {
            this.idCourse = idCourse;
            return this;
        }

        public ModuleBuilder idLessonList(List<String> idLessonList) {
            this.idLessonList = idLessonList;
            return this;
        }

        public Module build() {
            return new Module(this.idModule, this.title, this.idCourse, this.idLessonList);
        }

        public String toString() {
            return "Module.ModuleBuilder(idModule=" + this.idModule + ", title=" + this.title + ", idCourse=" + this.idCourse + ", idLessonList=" + this.idLessonList + ")";
        }
    }
}
