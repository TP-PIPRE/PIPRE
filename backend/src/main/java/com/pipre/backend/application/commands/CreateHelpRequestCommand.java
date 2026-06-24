package com.pipre.backend.application.commands;

public record CreateHelpRequestCommand(
        String idStudent,
        Integer aiInteractions
) {}
