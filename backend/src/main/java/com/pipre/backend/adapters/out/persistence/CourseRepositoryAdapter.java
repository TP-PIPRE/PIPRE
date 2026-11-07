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
    @Override @org.springframework.transaction.annotation.Transactional
    public Optional<Course> lockById(String id){return courseJpaRepository.lockById(id).map(courseMapper::toDomain);}
    @Override
    public Page<Course> findAllByIds(java.util.Set<String> ids,Pageable pageable) {
        return ids.isEmpty()?Page.empty(pageable):courseJpaRepository.findByIdCourseIn(ids,pageable).map(courseMapper::toDomain);
    }

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
    @org.springframework.transaction.annotation.Transactional
    public void save(Course course) {
        // Updating scalar details must not merge an empty orphan-removal collection.
        CourseJpaEntity entity = courseJpaRepository.findById(course.getIdCourse()).orElseGet(()->courseMapper.toJpaEntity(course));
        entity.setName(course.getName());entity.setDescription(course.getDescription());entity.setLevel(course.getLevel().name());
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
