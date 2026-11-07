package com.pipre.backend.application.ports.output;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.pipre.backend.domain.entities.course.Course;

public interface CourseRepositoryPort {
    List<Course> findAll();

    Page<Course> findAll(Pageable pageable);
    Page<Course> findAllByIds(java.util.Set<String> ids,Pageable pageable);

    void save(Course course);

    Optional<Course> findById(String idCourse);
    Optional<Course> lockById(String idCourse);

    void deleteById(String idCourse);
}
