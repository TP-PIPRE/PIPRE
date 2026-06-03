package com.pipre.backend.adapters.in.web.dto;

public record RatingRequestDTO(
        String idActivity,
        String idResult,
        String idHelpRequest
) {
}
