package com.pipre.backend.adapters.in.web.dto;

import java.util.UUID;

public record UserResponseDTO(
    String idUser,
    String firstName,
    String lastName,
    String email
) {
}
