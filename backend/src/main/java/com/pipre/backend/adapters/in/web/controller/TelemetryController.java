package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.SaveAttemptRequestDTO;
import com.pipre.backend.application.commands.SaveAttemptCommand;
import com.pipre.backend.application.ports.input.SaveAttemptUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/telemetry")
@RequiredArgsConstructor
@Tag(name = "Telemetría")
public class TelemetryController {

    private final SaveAttemptUseCase saveAttemptUseCase;

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Registrar un intento del simulador")
    @ApiResponse(responseCode = "201", description = "Intento registrado exitosamente")
    public ResponseEntity<Void> saveAttempt(@Valid @RequestBody SaveAttemptRequestDTO request) {
        SaveAttemptCommand command = new SaveAttemptCommand(
                request.studentId(),
                request.game(),
                request.result(),
                request.tiempoResolucion(),
                request.movimientos(),
                request.reinicios(),
                request.pistasIa(),
                request.completedAt());
        saveAttemptUseCase.execute(command);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
