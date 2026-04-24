package com.pipre.backend.infrastructure.adapter.in.rest.dto.request;

import java.util.UUID;

public record LessonsRequestDTO(
    UUID idLesson,
    String title
) {
}
