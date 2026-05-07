package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.RoleResponseDTO;

import java.util.List;

public interface GetRolesUseCase {
    List<RoleResponseDTO> execute();
}
