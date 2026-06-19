package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.GroupDTO;

import java.util.List;

public interface GetGroupsUseCase {
    List<GroupDTO> execute();
}
