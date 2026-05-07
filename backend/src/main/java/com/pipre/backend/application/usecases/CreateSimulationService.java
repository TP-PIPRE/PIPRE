package com.pipre.backend.application.usecases;

import com.pipre.backend.application.commands.CreateSimulationCommand;
import com.pipre.backend.application.ports.input.CreateSimulationUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CreateSimulationService implements CreateSimulationUseCase {
    @Override
    public String execute(CreateSimulationCommand cmd) {
        return "";
    }
}
