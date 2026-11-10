package com.pipre.backend.application.dto;

public record GameHintDTO(
        String requestId,
        String hintId,
        int revision,
        String source,
        int hintLevel,
        String type,
        String message,
        TargetCellDTO targetCell,
        TargetLineDTO targetLine) {
    public record TargetCellDTO(int x, int y) {}
    public record TargetLineDTO(String axis, int index) {}
}
