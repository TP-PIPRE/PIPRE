package com.pipre.backend.application.usecase;

import com.pipre.backend.domain.model.Course;
import com.pipre.backend.infrastructure.adapter.in.rest.dto.request.CourseRequestDTO;
import com.pipre.backend.infrastructure.adapter.in.rest.dto.response.CourseResponseDTO;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

    public List<CourseResponseDTO> getCourse() {
        List<Course> courses = courseRepository.findAll();
        return courses.stream()
                .map( course -> new CourseResponseDTO(
                        course.getIdCourse(),
                        course.getName()
                ))
                .toList();
    }

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

    @Transactional
    public void updateCourse(UUID idCourse, CourseRequestDTO requestDTO) {
        Course course = courseRepository.findById(idCourse)
                .orElseThrow(() -> new RuntimeException("Curso no existe"));

        course.setName(requestDTO.name());
        course.setDescription(requestDTO.description());
        course.setLevel(requestDTO.level());

        courseRepository.save(course);
    }

}
