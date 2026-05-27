package com.pipre.backend.adapters.in.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record RIA01ResponseDTO(
        @JsonProperty("resultado")
        String result,

        @JsonProperty("accuracy")
        Float accuracy,

        @JsonProperty("precision")
        Float precision,

        @JsonProperty("features_used")
        List<String> featuresUsed
) {
}
