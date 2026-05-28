package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.ActivityResponseDTO;

import java.util.List;

public interface GetActivitiesUseCase {
    List<ActivityResponseDTO> execute(String id);
}
