package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.UserDTO;
import java.util.List;

public interface GetAllUsersUseCase {
    List<UserDTO> execute();
}
