package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.ActivityDTO;

import java.util.List;

public interface GetActivitiesUseCase {
    List<ActivityDTO> execute(String id);
}
