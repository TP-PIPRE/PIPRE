package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.input.DeleteModuleUseCase;
import com.pipre.backend.application.ports.output.ModuleRepositoryPort;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeleteModuleService implements DeleteModuleUseCase {

    private final ModuleRepositoryPort moduleRepositoryPort;

    @Override
    @Transactional
    public void execute(String idModule) {
        moduleRepositoryPort.findById(idModule)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el módulo con ID: " + idModule));
        moduleRepositoryPort.deleteById(idModule);
    }
}
