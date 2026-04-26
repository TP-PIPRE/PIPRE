package com.pipre.backend.adapters.in.controller.dto;

public record CourseRequestDTO(
    String name,
    String description,
    String level
) {
}
