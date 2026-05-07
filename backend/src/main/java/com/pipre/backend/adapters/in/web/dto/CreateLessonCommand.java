package com.pipre.backend.adapters.in.web.dto;

public record CreateLessonCommand(
    String idModule,
    String title
) {
}
