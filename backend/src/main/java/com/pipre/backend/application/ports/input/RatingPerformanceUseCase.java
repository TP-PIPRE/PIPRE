package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.RatingRequestDTO;
import com.pipre.backend.adapters.in.web.dto.RatingResponseDTO;

public interface RatingPerformanceUseCase {
    RatingResponseDTO execute(RatingRequestDTO requestDTO);
}
