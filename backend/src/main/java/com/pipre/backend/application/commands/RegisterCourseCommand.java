package com.pipre.backend.application.commands;

public record RegisterCourseCommand(
    String name,
    String description,
    String level
) {
}
