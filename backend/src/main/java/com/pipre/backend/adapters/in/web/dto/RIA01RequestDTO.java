package com.pipre.backend.adapters.in.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RIA01RequestDTO(
        Integer attempts,
        Integer errors,
        @JsonProperty("logical_level")
        String logicLevel,
        @JsonProperty("ai_interactions")
        Float aiInteractions
) {
}
