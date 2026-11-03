package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.GameProgressDTO;

public interface GetGameProgressUseCase {
    GameProgressDTO progress(String studentId);
}
