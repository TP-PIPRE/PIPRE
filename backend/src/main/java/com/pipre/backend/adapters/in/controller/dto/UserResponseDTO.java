package com.pipre.backend.adapters.in.controller.dto;

import java.util.UUID;

public record UserResponseDTO(
    UUID idUser,
    String firstName,
    String lastName,
    String email
) {
}
