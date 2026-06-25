package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.RatingRequestDTO;
import com.pipre.backend.adapters.in.web.dto.RatingResponseDTO;
import com.pipre.backend.application.ports.input.RatePerformanceUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/performance")
@RequiredArgsConstructor
@Tag(name = "Desempeño / Performance", description = "Endpoints para evaluar el desempeño y calificación de actividades")
public class PerformanceController {

    private final RatePerformanceUseCase ratePerformanceUseCase;

    @PostMapping("/rating")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener evaluación y métricas de desempeño de una actividad")
    @ApiResponse(responseCode = "200", description = "Desempeño evaluado exitosamente")
    public ResponseEntity<RatingResponseDTO> rate(@RequestBody RatingRequestDTO request) {
        return ResponseEntity.ok(ratePerformanceUseCase.execute(request));
    }
}
