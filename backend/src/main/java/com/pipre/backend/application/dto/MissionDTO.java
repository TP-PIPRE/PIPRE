package com.pipre.backend.application.dto;

public record MissionDTO(
        String id,
        String title,
        String objective,
        Integer maxBlocks
) {
}
