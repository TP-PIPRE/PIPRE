package com.pipre.backend.domain.entities;

import java.util.List;

public class Activity {

    private final String idActivity;
    private final String name;
    private final String idLesson;
    private final List<String> idSimulationList;

    public Activity(Builder builder) {
        this.idActivity = builder.idActivity;
        this.name = builder.name;
        this.idSimulationList = builder.idSimulationList;
        this.idLesson = builder.idLesson;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getIdActivity() {
        return this.idActivity;
    }

    public String getName() {
        return this.name;
    }

    public String getIdLesson() {
        return this.idLesson;
    }

    public static class Builder {
        private String idActivity;
        private String name;
        private List<String> idSimulationList;
        private String idLesson;

        public Builder idActivity(String idActivity) {
            this.idActivity = idActivity;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder idSimulationList(List<String> idSimulationList) {
            this.idSimulationList = idSimulationList;
            return this;
        }

        public Builder idLesson(String idLesson) {
            this.idLesson = idLesson;
            return this;
        }

        public Activity build() {
            return new Activity(this);
        }
    }
}
