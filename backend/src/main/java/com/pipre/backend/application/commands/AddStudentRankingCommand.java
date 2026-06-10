package com.pipre.backend.application.commands;

public record AddStudentRankingCommand(
        String idGroup,
        String idStudent
) {}
