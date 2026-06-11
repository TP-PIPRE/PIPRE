package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.ModuleDTO;
import com.pipre.backend.application.ports.input.GetModulesUseCase;
import com.pipre.backend.application.ports.output.ModuleRepositoryPort;
import com.pipre.backend.domain.entities.module.Module;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetModulesService implements GetModulesUseCase {

    private final ModuleRepositoryPort moduleRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public List<ModuleDTO> execute(String idCourse) {
        return moduleRepositoryPort.findAllByIdCourse(idCourse)
                .stream()
                .map(module -> new ModuleDTO(
                        module.getIdModule(),
                        module.getTitle()
                ))
                .toList();
    }
}
