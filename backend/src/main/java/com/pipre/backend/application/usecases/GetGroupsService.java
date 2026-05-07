package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.GroupResponseDTO;
import com.pipre.backend.application.ports.input.GetGroupsUseCase;
import com.pipre.backend.application.ports.output.GroupRepositoryPort;
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
    public List<GroupResponseDTO> execute() {
        return  groupRepositoryPort.findAll()
                .stream()
                .map(group -> new GroupResponseDTO(
                        group.getIdGroup(),
                        group.getGroupName()
                ))
                .toList();
    }
}
