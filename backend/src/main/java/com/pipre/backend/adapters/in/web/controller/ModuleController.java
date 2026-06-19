package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.ModuleDTO;
import com.pipre.backend.application.commands.CreateModuleCommand;
import com.pipre.backend.application.ports.input.CreateModuleUseCase;
import com.pipre.backend.application.ports.input.GetModulesUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/modules")
@RequiredArgsConstructor
@Tag(name = "Módulos")
public class ModuleController {

    private final GetModulesUseCase getModulesUseCase;
    private final CreateModuleUseCase createModuleUseCase;

    @GetMapping("course/{idCourse}")
    @Operation(summary = "Obtener todos los módulos de un curso")
    @ApiResponse(responseCode = "200", description = "Módulos obtenidos exitosamente")
    public ResponseEntity<List<ModuleDTO>> getModules(@PathVariable String idCourse) {
        return ResponseEntity.ok(getModulesUseCase.execute(idCourse));
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo módulo")
    @ApiResponse(responseCode = "201", description = "Módulo creado exitosamente")
    public ResponseEntity<Void> postModule(@RequestBody CreateModuleCommand requestDTO) {
        createModuleUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
