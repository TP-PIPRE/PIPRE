package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.ModuleDTO;
import com.pipre.backend.application.commands.CreateModuleCommand;
import com.pipre.backend.application.ports.input.CreateModuleUseCase;
import com.pipre.backend.application.ports.input.GetModulesUseCase;
import com.pipre.backend.application.ports.input.DeleteModuleUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/modules")
@RequiredArgsConstructor
@Tag(name = "Módulos")
public class ModuleController {

    private final GetModulesUseCase getModulesUseCase;
    private final CreateModuleUseCase createModuleUseCase;
    private final DeleteModuleUseCase deleteModuleUseCase;

    @GetMapping("course/{idCourse}")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')")
    @Operation(summary = "Obtener todos los módulos de un curso paginados")
    @ApiResponse(responseCode = "200", description = "Módulos obtenidos exitosamente")
    public ResponseEntity<Page<ModuleDTO>> getModules(@PathVariable String idCourse, Pageable pageable) {
        return ResponseEntity.ok(getModulesUseCase.execute(idCourse, pageable));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Crear un nuevo módulo")
    @ApiResponse(responseCode = "201", description = "Módulo creado exitosamente")
    public ResponseEntity<Void> postModule(@RequestBody CreateModuleCommand requestDTO) {
        createModuleUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{idModule}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Eliminar un módulo existente")
    @ApiResponse(responseCode = "204", description = "Módulo eliminado exitosamente")
    public ResponseEntity<Void> deleteModule(@PathVariable String idModule) {
        deleteModuleUseCase.execute(idModule);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
