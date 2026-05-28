package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.Activity;

import java.util.List;
import java.util.Optional;

public interface ActivityRepositoryPort {
    List<Activity> findAll();
    void save(Activity newActivity);
    Optional<Activity> findById(String idActivity);
}
