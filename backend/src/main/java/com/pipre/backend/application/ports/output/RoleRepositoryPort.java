package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.Role;

import java.util.List;
import java.util.Optional;

public interface RoleRepositoryPort {

    List<Role> findAll();
    Optional<Role> findById(String idRole);

}
