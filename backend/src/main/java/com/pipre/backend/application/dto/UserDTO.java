package com.pipre.backend.application.dto;

public record UserDTO(
    String idUser,
    String firstName,
    String lastName,
    String email
) {
}
