package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.RoleUserRequestDTO;
import com.pipre.backend.application.ports.input.AssignRoleUseCase;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.Role;
import com.pipre.backend.domain.entities.User;
import com.pipre.backend.domain.exceptions.BusinessException;
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
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if(!roleRepositoryPort.existsById(requestDTO.idRole())) {
            throw new BusinessException("El rol no existe");
        }

        User userWithNewRole = user.addRole(requestDTO.idRole());
        userRepositoryPort.save(userWithNewRole);
    }
}
