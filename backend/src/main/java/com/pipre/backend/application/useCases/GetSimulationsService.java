package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.SimulationResponseDTO;
import com.pipre.backend.application.ports.input.GetSimulationsUseCase;
import com.pipre.backend.application.ports.output.SimulationRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetSimulationsService implements GetSimulationsUseCase {

    private final SimulationRepositoryPort simulationRepositoryPort;
    @Override
    public List<SimulationResponseDTO> execute(String idStudent) {
        return simulationRepositoryPort.getAllByStudentId(idStudent)
                .stream()
                .map(s -> new SimulationResponseDTO(
                        s.getIdSimulation(),
                        s.getResult()
                ))
                .toList();
    }
}
