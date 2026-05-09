package com.pipre.backend.application.commands;

public record CreateActivityCommand(
        String idLesson,
        String name
) {
}
