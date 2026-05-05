package com.pipre.backend.adapters.in.web.dto;

import java.util.UUID;

public record ActivityRequestDTO(
        UUID idLesson,
        String name
) {
}
