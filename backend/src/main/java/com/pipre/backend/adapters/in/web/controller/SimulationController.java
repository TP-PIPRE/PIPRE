package com.pipre.backend.adapters.in.web.controller;

import com.pipre.backend.adapters.in.web.dto.SimulationRequestDTO;
import com.pipre.backend.adapters.in.web.dto.SimulationResponseDTO;
import com.pipre.backend.application.ports.input.CreateSimulationUseCase;
import com.pipre.backend.application.ports.input.GetSimulationsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/simulations")
@RequiredArgsConstructor
public class SimulationController {

    private final GetSimulationsUseCase getSimulationsUseCase;
    private final CreateSimulationUseCase createSimulationUseCase;

    @GetMapping("/user/{idStudent}")
    public ResponseEntity<List<SimulationResponseDTO>> getSimulations(@PathVariable String idStudent) {
        return ResponseEntity.ok(getSimulationsUseCase.execute(idStudent));
    }

    @PostMapping
    public ResponseEntity<Void> createSimulation(@RequestBody SimulationRequestDTO requestDTO) {
        createSimulationUseCase.execute(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

}
