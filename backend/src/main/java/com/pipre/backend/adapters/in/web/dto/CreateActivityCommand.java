package com.pipre.backend.adapters.in.web.dto;

public record CreateActivityCommand(
        String idLesson,
        String name
) {
}
