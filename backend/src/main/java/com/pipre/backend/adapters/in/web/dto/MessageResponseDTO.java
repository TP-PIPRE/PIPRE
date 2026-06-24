package com.pipre.backend.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta genérica con mensaje de confirmación")
public record MessageResponseDTO(
    @Schema(description = "Mensaje descriptivo de la operación", example = "Operación realizada correctamente")
    String message
) {}
