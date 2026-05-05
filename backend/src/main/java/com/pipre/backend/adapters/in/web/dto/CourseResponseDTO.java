package com.pipre.backend.adapters.in.web.dto;

import java.util.UUID;

public record CourseResponseDTO(
    UUID idCourse,
    String name
) {
}
