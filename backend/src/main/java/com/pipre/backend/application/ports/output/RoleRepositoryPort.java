package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.Role;

import java.util.List;

public interface RoleRepositoryPort {

    List<Role> findAll();
    Boolean existsById(String idRole);

}
