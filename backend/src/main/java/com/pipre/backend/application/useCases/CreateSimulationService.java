package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.SimulationRequestDTO;
import com.pipre.backend.application.ports.input.CreateSimulationUseCase;
import com.pipre.backend.application.ports.output.SimulationRepositoryPort;
import com.pipre.backend.domain.entities.Simulation;
import com.pipre.backend.domain.factories.SimulationFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CreateSimulationService implements CreateSimulationUseCase {
    private final SimulationRepositoryPort simulationRepositoryPort;

    @Override
    public String execute(SimulationRequestDTO requestDTO) {
        Simulation simulation = SimulationFactory.createNewSimulation(
                requestDTO.result(),
                requestDTO.id_student(),
                requestDTO.id_activity()
        );
        simulationRepositoryPort.save(simulation);
        return simulation.getIdSimulation();
    }
}
