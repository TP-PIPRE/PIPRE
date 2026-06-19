package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.RoleDTO;

import java.util.List;

public interface GetRolesUseCase {
    List<RoleDTO> execute();
}
