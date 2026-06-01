package com.pipre.backend.domain.entities;

import java.util.List;

public class Activity {

    private final String idActivity;
    private final String name;
    private final String logicLevel;
    private final String idLesson;
    private final List<String> idSimulationList;

    Activity(String idActivity, String name, String logicLevel, String idLesson, List<String> idSimulationList) {
        this.idActivity = idActivity;
        this.name = name;
        this.logicLevel = logicLevel;
        this.idLesson = idLesson;
        this.idSimulationList = idSimulationList;
    }

    public static ActivityBuilder builder() {
        return new ActivityBuilder();
    }

    public String getIdActivity() {
        return this.idActivity;
    }

    public String getName() {
        return this.name;
    }

    public String getLogicLevel() {
        return this.logicLevel;
    }

    public String getIdLesson() {
        return this.idLesson;
    }

    public List<String> getIdSimulationList() {
        return this.idSimulationList;
    }

    public static class ActivityBuilder {
        private String idActivity;
        private String name;
        private String logicLevel;
        private String idLesson;
        private List<String> idSimulationList;

        ActivityBuilder() {
        }

        public ActivityBuilder idActivity(String idActivity) {
            this.idActivity = idActivity;
            return this;
        }

        public ActivityBuilder name(String name) {
            this.name = name;
            return this;
        }

        public ActivityBuilder logicLevel(String logicLevel) {
            this.logicLevel = logicLevel;
            return this;
        }

        public ActivityBuilder idLesson(String idLesson) {
            this.idLesson = idLesson;
            return this;
        }

        public ActivityBuilder idSimulationList(List<String> idSimulationList) {
            this.idSimulationList = idSimulationList;
            return this;
        }

        public Activity build() {
            return new Activity(this.idActivity, this.name, this.logicLevel, this.idLesson, this.idSimulationList);
        }

        public String toString() {
            return "Activity.ActivityBuilder(idActivity=" + this.idActivity + ", name=" + this.name + ", logicLevel=" + this.logicLevel + ", idLesson=" + this.idLesson + ", idSimulationList=" + this.idSimulationList + ")";
        }
    }
}
