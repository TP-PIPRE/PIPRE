package com.pipre.backend.application.ports.output;

import java.util.List;
import java.util.Optional;

import com.pipre.backend.domain.entities.course.Course;

public interface CourseRepositoryPort {
    List<Course> findAll();

    void save(Course course);

    Optional<Course> findById(String idCourse);
}
