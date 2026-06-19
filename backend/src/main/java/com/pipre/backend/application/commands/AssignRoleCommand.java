package com.pipre.backend.application.commands;

public record AssignRoleCommand(
        String idUser,
        String idRole
) {
}
