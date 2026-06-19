package com.pipre.backend.application.ports.output;

import java.util.List;
import java.util.Optional;

import com.pipre.backend.domain.entities.activity.Activity;

public interface ActivityRepositoryPort {
    List<Activity> findAll();

    List<Activity> findByLessonId(String idLesson);

    void save(Activity newActivity);

    Optional<Activity> findById(String idActivity);
}
