package com.pipre.backend.infrastructure.adapter.in.rest.dto.response;

import java.util.UUID;

public record CourseResponseDTO(
    UUID idCourse,
    String name
) {
}
