package com.pipre.backend.application.ports.output;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.pipre.backend.domain.entities.activity.Activity;

public interface ActivityRepositoryPort {
    List<Activity> findAll();

    List<Activity> findByLessonId(String idLesson);

    Page<Activity> findByLessonId(String idLesson, Pageable pageable);

    void save(Activity newActivity);

    Optional<Activity> findById(String idActivity);

    void deleteById(String idActivity);
}
