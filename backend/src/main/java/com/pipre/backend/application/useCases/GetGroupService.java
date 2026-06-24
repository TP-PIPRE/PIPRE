package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.GroupDTO;
import com.pipre.backend.application.ports.input.GetGroupUseCase;
import com.pipre.backend.application.ports.output.GroupRepositoryPort;
import com.pipre.backend.domain.entities.group.Group;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetGroupService implements GetGroupUseCase {

    private final GroupRepositoryPort groupRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public GroupDTO execute(String idGroup) {
        Group group = groupRepositoryPort.findById(idGroup)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el grupo con ID: " + idGroup));
        return new GroupDTO(
                group.getIdGroup(),
                group.getGroupName(),
                group.getDescription()
        );
    }
}
