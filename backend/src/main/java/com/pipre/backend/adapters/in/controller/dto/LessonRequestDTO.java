package com.pipre.backend.adapters.in.controller.dto;

import java.util.UUID;

public record LessonRequestDTO(
    UUID idModule,
    String title
) {
}
