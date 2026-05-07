package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.Activity;

import java.util.List;

public interface ActivityRepositoryPort {
    List<Activity> findAll();
    void save(Activity newActivity);
}
