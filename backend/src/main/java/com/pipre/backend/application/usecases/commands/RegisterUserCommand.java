package com.pipre.backend.application.usecases.commands;

import java.util.List;

public record RegisterUserCommand(
        String firstName,
        String lastName,
        String email,
        String passwordHash,
        String grade,
        Integer age,
        List<String> roleIdList
) {
}
