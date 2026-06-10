package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.SimulationDTO;

import java.util.List;

public interface GetSimulationsUseCase {
    List<SimulationDTO> execute(String idStudent);
}
