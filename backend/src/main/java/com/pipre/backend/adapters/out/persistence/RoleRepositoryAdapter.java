package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.mapper.RoleMapper;
import com.pipre.backend.adapters.out.persistence.mapper.UserMapper;
import com.pipre.backend.adapters.out.persistence.repository.RoleJpaRepository;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.domain.entities.Role;
import com.pipre.backend.domain.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RoleRepositoryAdapter implements RoleRepositoryPort {

    private final RoleJpaRepository jpaRepository;

    @Override
    public List<Role> findAll() {
        return jpaRepository.findAll()
                .stream()
                .map(RoleMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<Role> findById(String idRole) {
        return jpaRepository.findById(idRole)
                .map(RoleMapper::toDomain);
    }

    @Override
    public Boolean existsById(String idRole) {
        return jpaRepository.existsById(idRole);
    }

}
