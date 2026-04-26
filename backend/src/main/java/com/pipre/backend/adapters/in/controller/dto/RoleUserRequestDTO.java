package com.pipre.backend.adapters.in.controller.dto;

import java.util.UUID;

public record RoleUserRequestDTO(
        UUID idUser,
        UUID idRole
) {
}
