package com.pipre.backend.adapters.in.web.dto;

public record RegisterCourseCommand(
    String name,
    String description,
    String level
) {
}
