package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.SimulationRequestDTO;

public interface CreateSimulationUseCase {
    String execute(SimulationRequestDTO requestDTO);
}
