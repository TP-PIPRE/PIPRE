package com.pipre.backend.domain.entities.activity;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Activity {

    private final String idActivity;
    private final String name;
    private final ActivityLevel logicLevel;
    private final String idLesson;
    private final List<String> idSimulationList;

    private final String complexity;
    private final String difficulty;
    private final String type;
    private final String environment;
    private final Double startX;
    private final Double startZ;
    private final Double targetX;
    private final Double targetZ;
    private final List<Mission> missions;

    public Activity(ActivityBuilder builder) {
        this.idActivity = validateNotEmpty(builder.idActivity, "El ID de la actividad no puede estar vacío");
        this.name = validateNotEmpty(builder.name, "El nombre de la actividad no puede estar vacío");
        this.idLesson = validateNotEmpty(builder.idLesson, "El ID de la lección no puede estar vacío");
        this.logicLevel = builder.logicLevel;
        this.idSimulationList = builder.idSimulationList != null ? new ArrayList<>(builder.idSimulationList)
                : new ArrayList<>();
        this.complexity = builder.complexity;
        this.difficulty = builder.difficulty;
        this.type = builder.type;
        this.environment = builder.environment;
        this.startX = builder.startX;
        this.startZ = builder.startZ;
        this.targetX = builder.targetX;
        this.targetZ = builder.targetZ;
        this.missions = builder.missions != null ? new ArrayList<>(builder.missions) : new ArrayList<>();
    }

    private String validateNotEmpty(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(message);
        }
        return value;
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

    public ActivityLevel getLogicLevel() {
        return this.logicLevel;
    }

    public String getIdLesson() {
        return this.idLesson;
    }

    public List<String> getIdSimulationList() {
        return Collections.unmodifiableList(this.idSimulationList);
    }

    public String getComplexity() {
        return complexity;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public String getType() {
        return type;
    }

    public String getEnvironment() {
        return environment;
    }

    public Double getStartX() {
        return startX;
    }

    public Double getStartZ() {
        return startZ;
    }

    public Double getTargetX() {
        return targetX;
    }

    public Double getTargetZ() {
        return targetZ;
    }

    public List<Mission> getMissions() {
        return Collections.unmodifiableList(missions);
    }

    public static class ActivityBuilder {
        private String idActivity;
        private String name;
        private ActivityLevel logicLevel;
        private String idLesson;
        private List<String> idSimulationList;
        private String complexity;
        private String difficulty;
        private String type;
        private String environment;
        private Double startX;
        private Double startZ;
        private Double targetX;
        private Double targetZ;
        private List<Mission> missions;

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

        public ActivityBuilder logicLevel(ActivityLevel logicLevel) {
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

        public ActivityBuilder complexity(String complexity) {
            this.complexity = complexity;
            return this;
        }

        public ActivityBuilder difficulty(String difficulty) {
            this.difficulty = difficulty;
            return this;
        }

        public ActivityBuilder type(String type) {
            this.type = type;
            return this;
        }

        public ActivityBuilder environment(String environment) {
            this.environment = environment;
            return this;
        }

        public ActivityBuilder startX(Double startX) {
            this.startX = startX;
            return this;
        }

        public ActivityBuilder startZ(Double startZ) {
            this.startZ = startZ;
            return this;
        }

        public ActivityBuilder targetX(Double targetX) {
            this.targetX = targetX;
            return this;
        }

        public ActivityBuilder targetZ(Double targetZ) {
            this.targetZ = targetZ;
            return this;
        }

        public ActivityBuilder missions(List<Mission> missions) {
            this.missions = missions;
            return this;
        }

        public Activity build() {
            return new Activity(this);
        }
    }
}
