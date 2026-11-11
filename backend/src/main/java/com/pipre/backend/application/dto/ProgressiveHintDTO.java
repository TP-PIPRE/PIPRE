package com.pipre.backend.application.dto;

public record ProgressiveHintDTO(String requestId, int ordinal, String message, String source) {
    public record Status(int deliveredCount, ProgressiveHintDTO lastHint, boolean generating) {}
}
