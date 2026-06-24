package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.lesson.Lesson;

import java.util.List;

public interface LessonRepositoryPort {
    List<Lesson> findAll();
    void save(Lesson newLesson);
    boolean existsById(String idLesson);
}
