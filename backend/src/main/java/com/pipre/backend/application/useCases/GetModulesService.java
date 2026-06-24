package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.ModuleDTO;
import com.pipre.backend.application.ports.input.GetModulesUseCase;
import com.pipre.backend.application.ports.output.ModuleRepositoryPort;
import com.pipre.backend.domain.entities.module.Module;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetModulesService implements GetModulesUseCase {

    private final ModuleRepositoryPort moduleRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public Page<ModuleDTO> execute(String idCourse, Pageable pageable) {
        return moduleRepositoryPort.findAllByIdCourse(idCourse, pageable)
                .map(module -> new ModuleDTO(
                        module.getIdModule(),
                        module.getTitle()
                ));
    }
}
