package com.pipre.backend.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record LoginRequestDTO(
        @Schema(example = "admin@pipre.com")
        String email,
        @Schema(example = "123")
        String password) {
}
