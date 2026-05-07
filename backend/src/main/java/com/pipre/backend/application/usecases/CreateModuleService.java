package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.CreateModuleCommand;
import com.pipre.backend.application.ports.input.CreateModuleUseCase;
import com.pipre.backend.application.ports.output.ModuleRepositoryPort;
import com.pipre.backend.domain.entities.Module;
import com.pipre.backend.domain.factories.ModuleFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CreateModuleService implements CreateModuleUseCase {

    private final ModuleRepositoryPort moduleRepositoryPort;

    @Override
    public String execute(CreateModuleCommand cmd) {
        Module newModule = ModuleFactory.createNewModule(
                cmd.title(),
                null,
                null,
                null,
                null,
                cmd.idCourse()
        );
        moduleRepositoryPort.save(newModule);
        return newModule.getIdModule();
    }
}
