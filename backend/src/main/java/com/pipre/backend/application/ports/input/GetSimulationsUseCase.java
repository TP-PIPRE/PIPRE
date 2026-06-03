package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.SimulationResponseDTO;

import java.util.List;

public interface GetSimulationsUseCase {
    List<SimulationResponseDTO> execute(String idStudent);
}
