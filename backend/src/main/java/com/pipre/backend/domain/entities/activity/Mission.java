package com.pipre.backend.domain.entities.activity;

import com.pipre.backend.domain.exceptions.BusinessException;

public class Mission {
    private final String id;
    private final String title;
    private final String objective;
    private final Integer maxBlocks;

    public Mission(MissionBuilder builder) {
        if (builder.id == null || builder.id.trim().isEmpty()) {
            throw new BusinessException("El ID de la misión no puede estar vacío");
        }
        if (builder.title == null || builder.title.trim().isEmpty()) {
            throw new BusinessException("El título de la misión no puede estar vacío");
        }
        this.id = builder.id;
        this.title = builder.title;
        this.objective = builder.objective;
        this.maxBlocks = builder.maxBlocks;
    }

    public static MissionBuilder builder() {
        return new MissionBuilder();
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getObjective() {
        return objective;
    }

    public Integer getMaxBlocks() {
        return maxBlocks;
    }

    public static class MissionBuilder {
        private String id;
        private String title;
        private String objective;
        private Integer maxBlocks;

        MissionBuilder() {
        }

        public MissionBuilder id(String id) {
            this.id = id;
            return this;
        }

        public MissionBuilder title(String title) {
            this.title = title;
            return this;
        }

        public MissionBuilder objective(String objective) {
            this.objective = objective;
            return this;
        }

        public MissionBuilder maxBlocks(Integer maxBlocks) {
            this.maxBlocks = maxBlocks;
            return this;
        }

        public Mission build() {
            return new Mission(this);
        }
    }
}
