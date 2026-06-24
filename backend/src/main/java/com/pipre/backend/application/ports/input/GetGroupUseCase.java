package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.GroupDTO;

public interface GetGroupUseCase {
    GroupDTO execute(String idGroup);
}
