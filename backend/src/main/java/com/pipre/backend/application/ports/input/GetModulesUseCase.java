package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.ModuleDTO;

import java.util.List;

public interface GetModulesUseCase {
    List<ModuleDTO> execute(String idCourse);
}
