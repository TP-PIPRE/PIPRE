package com.pipre.backend.adapters.in.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import io.swagger.v3.oas.annotations.media.Schema;

public record LoginRequestDTO(
        @Schema(example = "admin@pipre.com")
        @NotBlank(message = "El email no puede estar vacío")
        @Email(message = "El formato de email no es válido")
        String email,
        @Schema(example = "123")
        @NotBlank(message = "La contraseña no puede estar vacía")
        String password) {
}
