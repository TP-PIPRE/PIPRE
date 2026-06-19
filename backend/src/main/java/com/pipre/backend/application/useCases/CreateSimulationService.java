package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateSimulationCommand;
import com.pipre.backend.application.ports.input.CreateSimulationUseCase;
import com.pipre.backend.application.ports.output.SimulationRepositoryPort;
import com.pipre.backend.domain.entities.simulation.Simulation;
import com.pipre.backend.domain.factories.SimulationFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CreateSimulationService implements CreateSimulationUseCase {
    private final SimulationRepositoryPort simulationRepositoryPort;

    @Override
    public String execute(CreateSimulationCommand command) {
        Simulation simulation = SimulationFactory.createNewSimulation(
                command.result(),
                command.idStudent(),
                command.idActivity());
        simulationRepositoryPort.save(simulation);
        return simulation.getIdSimulation();
    }
}
