package com.pipre.backend.adapters.in.controller.dto;

public record UserRequestDTO(
    String firstName,
    String lastName,
    Integer age,
    String grade,
    String email,
    String passwordHash,
    String institution,
    String zone
) {
}
