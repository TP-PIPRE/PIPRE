package com.pipre.backend.infrastructure.adapter.in.rest.dto.request;

public record CourseRequestPostDTO(
    String name,
    String description,
    String level
) {
}
