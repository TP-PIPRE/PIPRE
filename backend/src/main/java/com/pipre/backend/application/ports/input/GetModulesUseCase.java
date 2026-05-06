package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.ModuleResponseDTO;

import java.util.List;

public interface GetModulesUseCase {
    List<ModuleResponseDTO> execute(String idCourse);
}
