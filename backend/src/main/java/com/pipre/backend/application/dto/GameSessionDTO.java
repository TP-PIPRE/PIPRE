package com.pipre.backend.application.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record GameSessionDTO(String sessionId, String game, int levelNumber, String levelTemplate,
        String ruleset, String startedAt, String status, JsonNode state, int revision) {}
