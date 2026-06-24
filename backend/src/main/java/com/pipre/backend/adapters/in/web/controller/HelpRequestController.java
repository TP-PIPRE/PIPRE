package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.commands.CreateHelpRequestCommand;
import com.pipre.backend.application.dto.HelpRequestDTO;
import com.pipre.backend.application.ports.input.CreateHelpRequestUseCase;
import com.pipre.backend.application.ports.input.GetHelpRequestsUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/help-requests")
@RequiredArgsConstructor
@Tag(name = "Peticiones de Ayuda", description = "Endpoints para gestionar las peticiones de ayuda de los estudiantes")
public class HelpRequestController {

    private final CreateHelpRequestUseCase createHelpRequestUseCase;
    private final GetHelpRequestsUseCase getHelpRequestsUseCase;

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Crear una nueva petición de ayuda")
    @ApiResponse(responseCode = "201", description = "Petición de ayuda creada exitosamente")
    public ResponseEntity<Void> createHelpRequest(@RequestBody CreateHelpRequestCommand command) {
        createHelpRequestUseCase.execute(command);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/{idStudent}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)")
    @Operation(summary = "Obtener todas las peticiones de ayuda de un estudiante")
    @ApiResponse(responseCode = "200", description = "Peticiones de ayuda obtenidas exitosamente")
    public ResponseEntity<List<HelpRequestDTO>> getHelpRequests(@PathVariable String idStudent) {
        return ResponseEntity.ok(getHelpRequestsUseCase.execute(idStudent));
    }
}
