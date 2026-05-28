package com.pipre.backend.adapters.in.web.dto;

public record RatingResponseDTO(
        String result,
        Float accuracy,
        Float precision
) {
}
