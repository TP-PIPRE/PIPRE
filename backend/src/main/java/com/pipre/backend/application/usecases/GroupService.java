package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.controller.dto.GroupResponseDTO;
import com.pipre.backend.adapters.out.persistence.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;

    @Transactional(readOnly = true)
    public List<GroupResponseDTO> getGroups() {
        return groupRepository.findAll().stream()
                .map(groupJpa -> new GroupResponseDTO(
                        groupJpa.getIdGroup(),
                        groupJpa.getGroupName()
                ))
                .toList();
    }
}
