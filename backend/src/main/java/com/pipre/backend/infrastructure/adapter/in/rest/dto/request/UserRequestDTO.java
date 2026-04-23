package com.pipre.backend.infrastructure.adapter.in.rest.dto.request;

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
