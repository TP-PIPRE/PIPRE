package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.ResultRequestDTO;

public interface SaveResultUseCase {
    String execute(ResultRequestDTO requestDTO);
}
