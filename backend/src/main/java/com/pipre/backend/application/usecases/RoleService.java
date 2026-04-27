package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.controller.dto.RoleResponseDTO;
import com.pipre.backend.adapters.in.controller.dto.RoleUserRequestDTO;
import com.pipre.backend.adapters.out.persistence.jpaEntities.RoleJpa;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpa;
import com.pipre.backend.adapters.out.persistence.repository.RoleRepository;
import com.pipre.backend.adapters.out.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<RoleResponseDTO> getRoles() {
        return roleRepository.findAll().stream()
                .map(roleJpa -> new RoleResponseDTO(
                        roleJpa.getIdRole().toString(),
                        roleJpa.getName()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public void getRoleUser(RoleUserRequestDTO requestDTO) {
        UserJpa user = userRepository.findById(requestDTO.idUser())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        RoleJpa role = roleRepository.findById(requestDTO.idRole())
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));
        user.getRoleJpas().add(role);
        userRepository.save(user);
    }
}
