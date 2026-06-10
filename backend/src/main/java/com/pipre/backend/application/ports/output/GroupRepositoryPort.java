package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.group.Group;

import java.util.List;
import java.util.Optional;

public interface GroupRepositoryPort {
    List<Group> findAll();
    Optional<Group> findById(String idGroup);
    void save(Group group);
}
