package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.ActivityRequestDTO;

public interface CreateActivityUseCase {
    void execute(ActivityRequestDTO requestDTO);
}
