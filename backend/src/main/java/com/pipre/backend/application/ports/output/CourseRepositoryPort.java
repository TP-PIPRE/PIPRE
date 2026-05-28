package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.Course;

import java.util.List;
import java.util.Optional;

public interface CourseRepositoryPort {
    List<Course> findAll();
    void save(Course course);
    Optional<Course> findById(String idCourse);
}
