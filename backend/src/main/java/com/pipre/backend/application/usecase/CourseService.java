package com.pipre.backend.application.usecase;

import com.pipre.backend.domain.model.Course;
import com.pipre.backend.infrastructure.adapter.in.rest.dto.request.CourseRequestDTO;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

    @Transactional
    public void postCourse(CourseRequestDTO requestDTO) {
        Course course = new Course(
                null,
                requestDTO.name(),
                requestDTO.description(),
                requestDTO.level(),
                "Aprendizaje de robótica",
                LocalDateTime.now(),
                null
        );

        courseRepository.save(course);

    }
}
