package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.GroupDTO;
import com.pipre.backend.application.ports.input.GetGroupsUseCase;
import com.pipre.backend.application.ports.output.GroupRepositoryPort;
import com.pipre.backend.domain.entities.group.Group;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetGroupsService implements GetGroupsUseCase {

    private final GroupRepositoryPort groupRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public List<GroupDTO> execute() {
        return groupRepositoryPort.findAll()
                .stream()
                .map(group -> new GroupDTO(
                        group.getIdGroup(),
                        group.getGroupName(),
                        group.getDescription()
                ))
                .toList();
    }
}
