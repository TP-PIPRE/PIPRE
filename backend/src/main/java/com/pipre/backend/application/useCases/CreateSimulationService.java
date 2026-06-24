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
        // Heurística para calcular predictedScore (valor de 0 a 100)
        int predictedScore = 0;
        if ("SUCCESS".equalsIgnoreCase(command.result())) {
            predictedScore = 100;
            // Descontar por sensor error (ej. por cada 0.1 de error, restamos 10 puntos)
            if (command.sensorError() != null) {
                predictedScore -= (int) (command.sensorError() * 100);
            }
            // Descontar por tiempo excesivo de resolución (ej. si tarda más de 60 segundos (60000 ms), descontar 1 punto por cada 2 segundos adicionales)
            if (command.resolutionTime() != null && command.resolutionTime() > 60000) {
                predictedScore -= (command.resolutionTime() - 60000) / 2000;
            }
            // Descontar por exceso de bloques (ej. si usa más de 10 bloques, descontar 2 puntos por bloque extra)
            if (command.blocksUsage() != null && command.blocksUsage() > 10) {
                predictedScore -= (command.blocksUsage() - 10) * 2;
            }
            // Asegurar que el score no sea menor que 50 para un SUCCESS
            predictedScore = Math.max(50, predictedScore);
        } else {
            // Si falló la simulación
            predictedScore = 30;
            if (command.blocksUsage() != null && command.blocksUsage() > 0) {
                predictedScore += Math.min(20, command.blocksUsage() * 2);
            }
        }
        // Asegurar rango 0 - 100
        predictedScore = Math.max(0, Math.min(100, predictedScore));

        Simulation simulation = SimulationFactory.createNewSimulation(
                command.result(),
                command.idStudent(),
                command.idActivity(),
                command.blocklyCode(),
                command.pseudocode(),
                command.pseintDiagram(),
                command.blocksUsage(),
                command.codeUsage(),
                command.sensorError(),
                command.resolutionTime(),
                predictedScore
        );
        simulationRepositoryPort.save(simulation);
        return simulation.getIdSimulation();
    }
}
