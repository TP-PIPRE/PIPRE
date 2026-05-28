package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.UserResponseDTO;

public interface GetUserByIdUseCase {
    UserResponseDTO execute(String id);
}
