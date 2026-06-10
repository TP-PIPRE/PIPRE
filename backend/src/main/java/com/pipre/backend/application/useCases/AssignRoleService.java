package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.RoleUserRequestDTO;
import com.pipre.backend.application.ports.input.AssignRoleUseCase;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.exceptions.BusinessException;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AssignRoleService implements AssignRoleUseCase {

    private final UserRepositoryPort userRepositoryPort;
    private final RoleRepositoryPort roleRepositoryPort;

    @Override
    @Transactional
    public void execute(RoleUserRequestDTO requestDTO) {
        User user = userRepositoryPort.findById(requestDTO.idUser())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if(!roleRepositoryPort.existsById(requestDTO.idRole())) {
            throw new BusinessException("El rol no existe");
        }

        User userWithNewRole = user.addRole(requestDTO.idRole());
        userRepositoryPort.save(userWithNewRole);
    }
}
