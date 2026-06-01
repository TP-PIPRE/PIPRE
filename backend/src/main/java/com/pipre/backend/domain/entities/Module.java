package com.pipre.backend.domain.entities;

import java.util.List;

public class Module {

    private final String idModule;
    private final String title;
    private final List<String> idLessonList;
    private final String idCourse;

    Module(String idModule, String title, List<String> idLessonList, String idCourse) {
        this.idModule = idModule;
        this.title = title;
        this.idLessonList = idLessonList;
        this.idCourse = idCourse;
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

    public List<String> getIdLessonList() {
        return this.idLessonList;
    }

    public String getIdCourse() {
        return this.idCourse;
    }

    public static class ModuleBuilder {
        private String idModule;
        private String title;
        private List<String> idLessonList;
        private String idCourse;

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

        public ModuleBuilder idLessonList(List<String> idLessonList) {
            this.idLessonList = idLessonList;
            return this;
        }

        public ModuleBuilder idCourse(String idCourse) {
            this.idCourse = idCourse;
            return this;
        }

        public Module build() {
            return new Module(this.idModule, this.title, this.idLessonList, this.idCourse);
        }

        public String toString() {
            return "Module.ModuleBuilder(idModule=" + this.idModule + ", title=" + this.title + ", idLessonList=" + this.idLessonList + ", idCourse=" + this.idCourse + ")";
        }
    }
}
