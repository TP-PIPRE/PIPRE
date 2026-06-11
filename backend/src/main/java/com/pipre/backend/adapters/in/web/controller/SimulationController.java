package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.application.dto.SimulationDTO;
import com.pipre.backend.application.commands.CreateSimulationCommand;
import com.pipre.backend.application.ports.input.CreateSimulationUseCase;
import com.pipre.backend.application.ports.input.GetSimulationsUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/simulations")
@RequiredArgsConstructor
@Tag(name = "Simulaciones")
public class SimulationController {

    private final GetSimulationsUseCase getSimulationsUseCase;
    private final CreateSimulationUseCase createSimulationUseCase;

    @GetMapping("/user/{idStudent}")
    @Operation(summary = "Obtener todas las simulaciones de un estudiante")
    @ApiResponse(responseCode = "200", description = "Simulaciones obtenidas exitosamente")
    public ResponseEntity<List<SimulationDTO>> getSimulations(@PathVariable String idStudent) {
        return ResponseEntity.ok(getSimulationsUseCase.execute(idStudent));
    }

    @PostMapping
    @Operation(summary = "Crear una nueva simulación")
    @ApiResponse(responseCode = "201", description = "Simulación creada exitosamente")
    public ResponseEntity<Void> createSimulation(@RequestBody CreateSimulationCommand command) {
        createSimulationUseCase.execute(command);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
