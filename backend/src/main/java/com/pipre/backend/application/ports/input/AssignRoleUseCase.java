package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.RoleUserRequestDTO;

public interface AssignRoleUseCase {
    void execute(RoleUserRequestDTO requestDTO);
}
