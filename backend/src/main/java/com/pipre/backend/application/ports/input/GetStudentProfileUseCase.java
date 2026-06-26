package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.PlayerProfileDTO;

public interface GetStudentProfileUseCase {
    PlayerProfileDTO execute(String idStudent);
}
