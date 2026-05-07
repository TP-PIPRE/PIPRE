package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.ModuleResponseDTO;
import com.pipre.backend.application.ports.input.GetModulesUseCase;
import com.pipre.backend.application.ports.output.ModuleRepositoryPort;
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
    public List<ModuleResponseDTO> execute(String idCourse) {
        return moduleRepositoryPort.findAllByIdCourse(idCourse)
                .stream()
                .map(module -> new ModuleResponseDTO(
                        module.getIdModule(),
                        module.getTitle()
                ))
                .toList();
    }
}
