package com.pipre.backend.domain.entities;

import java.util.List;

public class Activity {

    private final String idActivity;
    private final String name;
    private final String difficulty;
    private final Integer logicLevel;
    private final String type;
    private final List<String> idimulationList;
    private final String idLesson;

    public Activity(Builder builder) {
        this.idActivity = builder.idActivity;
        this.name = builder.name;
        this.difficulty = builder.difficulty;
        this.logicLevel = builder.logicLevel;
        this.type = builder.type;
        this.idimulationList = builder.idimulationList;
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

    public String getDifficulty() {
        return this.difficulty;
    }

    public Integer getLogicLevel() {
        return this.logicLevel;
    }

    public String getType() {
        return this.type;
    }

    public List<String> getIdimulationList() {
        return this.idimulationList;
    }

    public String getIdLesson() {
        return this.idLesson;
    }

    public static class Builder {
        private String idActivity;
        private String name;
        private String difficulty;
        private Integer logicLevel;
        private String type;
        private List<String> idimulationList;
        private String idLesson;

        public Builder() {
        }

        public Builder idActivity(String idActivity) {
            this.idActivity = idActivity;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder difficulty(String difficulty) {
            this.difficulty = difficulty;
            return this;
        }

        public Builder logicLevel(Integer logicLevel) {
            this.logicLevel = logicLevel;
            return this;
        }

        public Builder type(String type) {
            this.type = type;
            return this;
        }

        public Builder idimulationList(List<String> idimulationList) {
            this.idimulationList = idimulationList;
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
