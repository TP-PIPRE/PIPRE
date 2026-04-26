package com.pipre.backend.adapters.in.controller.dto;

import java.util.UUID;

public record LessonResponseDTO(
        UUID idLesson,
        String title
) {
}
