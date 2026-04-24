package com.pipre.backend.infrastructure.adapter.in.rest.dto.request;

import java.util.UUID;

public record CourseRequestPutDTO(
    UUID idCourse,
    String name,
    String description,
    String level
) {
}
