package com.pipre.backend.application.commands;

public record CreateLessonCommand(
    String idModule,
    String title
) {
}
