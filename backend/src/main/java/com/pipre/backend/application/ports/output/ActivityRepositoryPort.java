package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.Activity;

import java.util.List;

public interface ActivityRepositoryPort {
    List<Activity> findAll();
    Boolean existsByName(String name);
}
