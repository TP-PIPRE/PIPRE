package com.pipre.backend.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta de inicio de sesión exitoso")
public record LoginResponseDTO(
    @Schema(description = "Mensaje de confirmación", example = "Sesión iniciada correctamente")
    String message,
    
    @Schema(description = "Datos básicos del usuario autenticado")
    UserResponseDTO user
) {
    @Schema(description = "Detalle del usuario en la respuesta de autenticación")
    public record UserResponseDTO(
        @Schema(description = "ID único del usuario", example = "uuid")
        String idUser,

        @Schema(description = "Correo electrónico del usuario", example = "admin@pipre.com")
        String email,

        @Schema(description = "Nombre del usuario", example = "Juan")
        String firstName,

        @Schema(description = "Apellido del usuario", example = "Pérez")
        String lastName,

        @Schema(description = "Rol asignado", example = "student")
        String role
    ) {}
}
