package com.pipre.backend.adapters.in.web.dto;

import java.util.UUID;

public record LessonRequestDTO(
    UUID idModule,
    String title
) {
}
