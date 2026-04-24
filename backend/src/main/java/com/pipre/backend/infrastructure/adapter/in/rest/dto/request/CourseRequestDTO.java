package com.pipre.backend.infrastructure.adapter.in.rest.dto.request;

public record CourseRequestDTO(
    String name,
    String description,
    String level
) {
}
