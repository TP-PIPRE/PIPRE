package com.pipre.backend.application.dto;

public record CourseDTO(
    String idCourse,
    String name,
    String description,
    String level
) {
}
