package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.mapper.RoleMapper;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.RoleJpaRepository;
import com.pipre.backend.application.ports.output.RoleRepositoryPort;
import com.pipre.backend.domain.entities.role.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RoleRepositoryAdapter implements RoleRepositoryPort {

    private final RoleJpaRepository jpaRepository;
    private final RoleMapper roleMapper;
    @Override public void lockAdministration() {jpaRepository.lockAdministration().orElseThrow(()->new IllegalStateException("ADMIN role is missing"));}
    @Override public long activeAdministrators() {return jpaRepository.activeAdministrators();}

    @Override
    public List<Role> findAll() {
        return jpaRepository.findAll()
                .stream()
                .map(roleMapper::toDomain)
                .toList();
    }

    @Override
    public Boolean existsById(String idRole) {
        return jpaRepository.existsById(idRole);
    }

}
