package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.ActivityDTO;

public interface GetActivityUseCase {
    ActivityDTO execute(String idActivity);
}
