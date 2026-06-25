package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.DropoutRiskDTO;
import com.pipre.backend.application.ports.input.GetDropoutRiskUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dropout-risk")
@RequiredArgsConstructor
@Tag(name = "Riesgo de Deserción", description = "Endpoints para consultar el riesgo de deserción de los estudiantes")
public class DropoutRiskController {

    private final GetDropoutRiskUseCase getDropoutRiskUseCase;

    @GetMapping("/{idStudent}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)")
    @Operation(summary = "Obtener el riesgo de deserción analizado para un estudiante")
    @ApiResponse(responseCode = "200", description = "Riesgo de deserción obtenido exitosamente")
    public ResponseEntity<DropoutRiskDTO> getDropoutRisk(@PathVariable String idStudent) {
        return ResponseEntity.ok(getDropoutRiskUseCase.execute(idStudent));
    }
}
