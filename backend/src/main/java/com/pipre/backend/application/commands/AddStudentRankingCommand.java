package com.pipre.backend.application.commands;

public record AddStudentRankingCommand(
        @jakarta.validation.constraints.NotBlank String idGroup,
        @jakarta.validation.constraints.NotBlank String idStudent
) {}
