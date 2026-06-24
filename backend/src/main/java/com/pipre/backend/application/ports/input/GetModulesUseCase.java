package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.ModuleDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GetModulesUseCase {
    Page<ModuleDTO> execute(String idCourse, Pageable pageable);
}
