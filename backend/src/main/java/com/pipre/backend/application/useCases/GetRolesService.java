package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.RoleDTO;
import com.pipre.backend.application.ports.input.GetRolesUseCase;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetRolesService implements GetRolesUseCase {

    private final RoleRepositoryPort repositoryPort;

    @Override
    @Transactional(readOnly = true)
    public List<RoleDTO> execute() {
        return repositoryPort.findAll()
                .stream()
                .map(role -> new RoleDTO(
                        role.getIdRole(),
                        role.getName()
                ))
                .toList();
    }
}
