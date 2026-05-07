package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.Group;

import java.util.List;

public interface GroupRepositoryPort {
    List<Group> findAll();
}
