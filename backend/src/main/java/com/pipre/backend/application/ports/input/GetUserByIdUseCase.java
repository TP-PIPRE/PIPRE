package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.UserDTO;

public interface GetUserByIdUseCase {
    UserDTO execute(String id);
}
