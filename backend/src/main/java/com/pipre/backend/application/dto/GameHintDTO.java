package com.pipre.backend.application.dto;

public record GameHintDTO(
        String requestId,
        String hintId,
        int revision,
        String source,
        int hintLevel,
        String type,
        String message,
        TargetCellDTO targetCell) {
    public record TargetCellDTO(int x, int y) {}
}
