package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.ModuleRequestDTO;

public interface CreateModuleUseCase {
    void execute(ModuleRequestDTO requestDTO);
}
