package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpaEntity;
import com.pipre.backend.adapters.out.persistence.mapper.CourseMapper;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.CourseJpaRepository;
import com.pipre.backend.application.ports.output.CourseRepositoryPort;
import com.pipre.backend.domain.entities.course.Course;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Component
@RequiredArgsConstructor
public class CourseRepositoryAdapter implements CourseRepositoryPort {

    private final CourseJpaRepository courseJpaRepository;
    private final CourseMapper courseMapper;

    @Override
    public List<Course> findAll() {
        return courseJpaRepository.findAll()
                .stream()
                .map(courseMapper::toDomain)
                .toList();
    }

    @Override
    public Page<Course> findAll(Pageable pageable) {
        return courseJpaRepository.findAll(pageable)
                .map(courseMapper::toDomain);
    }

    @Override
    public void save(Course course) {
        CourseJpaEntity entity = courseMapper.toJpaEntity(course);
        courseJpaRepository.save(entity);
    }

    @Override
    public Optional<Course> findById(String idCourse) {
        return courseJpaRepository.findById(idCourse)
                .map(courseMapper::toDomain);
    }

    @Override
    public void deleteById(String idCourse) {
        courseJpaRepository.deleteById(idCourse);
    }
}
