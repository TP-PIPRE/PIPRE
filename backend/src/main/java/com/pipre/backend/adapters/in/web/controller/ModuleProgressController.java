package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.commands.SaveModuleProgressCommand;
import com.pipre.backend.application.dto.ModuleProgressDTO;
import com.pipre.backend.application.ports.input.GetModuleProgressUseCase;
import com.pipre.backend.application.ports.input.SaveModuleProgressUseCase;
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
@RequestMapping("/api/v1/module-progress")
@RequiredArgsConstructor
@Tag(name = "Progreso de Módulos", description = "Endpoints para gestionar y consultar el progreso de los estudiantes en los módulos")
public class ModuleProgressController {

    private final SaveModuleProgressUseCase saveModuleProgressUseCase;
    private final GetModuleProgressUseCase getModuleProgressUseCase;

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Registrar o actualizar el progreso de un módulo")
    @ApiResponse(responseCode = "200", description = "Progreso guardado exitosamente")
    public ResponseEntity<Void> saveModuleProgress(@RequestBody SaveModuleProgressCommand command) {
        saveModuleProgressUseCase.execute(command);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user/{idStudent}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN') or @securityService.isCurrentUser(#idStudent)")
    @Operation(summary = "Obtener el progreso en los módulos de un estudiante")
    @ApiResponse(responseCode = "200", description = "Progreso de módulos obtenido exitosamente")
    public ResponseEntity<List<ModuleProgressDTO>> getModuleProgress(@PathVariable String idStudent) {
        return ResponseEntity.ok(getModuleProgressUseCase.execute(idStudent));
    }
}
