package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.ResultDTO;
import com.pipre.backend.application.commands.SaveResultCommand;
import com.pipre.backend.application.ports.input.GetStudentResultUseCase;
import com.pipre.backend.application.ports.input.SaveResultUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/activity-results")
@RequiredArgsConstructor
@Tag(name = "Resultados", description = "Endpoints para la gestión de resultados de actividades")
public class ResultController {

    private final GetStudentResultUseCase getStudentResultUseCase;
    private final SaveResultUseCase saveResultUseCase;

    @GetMapping("/user/{idStudent}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)")
    @Operation(summary = "Obtener resultados de actividades por estudiante")
    @ApiResponse(responseCode = "200", description = "Resultados obtenidos exitosamente")
    public ResponseEntity<List<ResultDTO>> getStudentResult(@PathVariable String idStudent) {
        return ResponseEntity.ok(getStudentResultUseCase.execute(idStudent));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Guardar un nuevo resultado de actividad")
    @ApiResponse(responseCode = "201", description = "Resultado guardado exitosamente")
    public ResponseEntity<Void> saveResult(@RequestBody SaveResultCommand command) {
        saveResultUseCase.execute(command);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

}
