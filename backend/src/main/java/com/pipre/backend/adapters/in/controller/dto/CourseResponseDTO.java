package com.pipre.backend.adapters.in.controller.dto;

import java.util.UUID;

public record CourseResponseDTO(
    UUID idCourse,
    String name
) {
}
