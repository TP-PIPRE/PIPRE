package com.pipre.backend.application.ports.input;

import com.pipre.backend.adapters.in.web.dto.GroupResponseDTO;

import java.util.List;

public interface GetGroupsUseCase {
    List<GroupResponseDTO> execute();
}
