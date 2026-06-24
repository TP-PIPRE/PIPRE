package com.pipre.backend.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.Map;

@Schema(description = "Representación estándar de errores de la API")
public record ApiErrorResponse(
    @Schema(description = "Fecha y hora en la que ocurrió el error", example = "2026-06-24T06:24:32")
    LocalDateTime timestamp,
    
    @Schema(description = "Tipo o clasificación del error", example = "Credenciales incorrectas")
    String error,
    
    @Schema(description = "Mensaje de descripción detallada del error", example = "El correo o la contraseña ingresados son incorrectos.")
    String message,
    
    @Schema(description = "Detalle de errores de validación por campo (opcional)", type = "object", example = "{\"campo\": \"mensaje de error\"}")
    Object errors
) {}
