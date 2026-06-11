package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.commands.CreateSimulationCommand;

public interface CreateSimulationUseCase {
    String execute(CreateSimulationCommand command);
}
