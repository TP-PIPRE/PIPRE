package com.pipre.backend.adapters.in.web.dto;

public record UserResponseDTO(
    String idUser,
    String firstName,
    String lastName,
    String email
) {
}
