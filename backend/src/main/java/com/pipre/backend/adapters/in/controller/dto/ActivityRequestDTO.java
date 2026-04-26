package com.pipre.backend.adapters.in.controller.dto;

import java.util.UUID;

public record ActivityRequestDTO(
        UUID idLesson,
        String name
) {
}
