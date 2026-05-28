package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.RoleResponseDTO;
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
    public List<RoleResponseDTO> execute() {
        return repositoryPort.findAll()
                .stream()
                .map(role -> new RoleResponseDTO(
                        role.getIdRole(),
                        role.getName()
                ))
                .toList();
    }
}
