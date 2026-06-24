package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.ModuleProgressDTO;
import java.util.List;

public interface GetModuleProgressUseCase {
    List<ModuleProgressDTO> execute(String idStudent);
}
