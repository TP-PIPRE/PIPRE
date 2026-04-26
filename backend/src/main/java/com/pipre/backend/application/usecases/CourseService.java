package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpa;
import com.pipre.backend.adapters.in.controller.dto.CourseRequestDTO;
import com.pipre.backend.adapters.in.controller.dto.CourseResponseDTO;
import com.pipre.backend.adapters.out.persistence.repository.CourseRepository;
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
        List<CourseJpa> cours = courseRepository.findAll();
        return cours.stream()
                .map(courseJpa -> new CourseResponseDTO(
                        courseJpa.getIdCourse(),
                        courseJpa.getName()
                ))
                .toList();
    }

    @Transactional
    public void postCourse(CourseRequestDTO requestDTO) {
        CourseJpa courseJpa = new CourseJpa(
                null,
                requestDTO.name(),
                requestDTO.description(),
                requestDTO.level(),
                "Aprendizaje de robótica",
                LocalDateTime.now(),
                null
        );
        courseRepository.save(courseJpa);
    }

    @Transactional
    public void updateCourse(UUID idCourse, CourseRequestDTO requestDTO) {
        CourseJpa courseJpa = courseRepository.findById(idCourse)
                .orElseThrow(() -> new RuntimeException("Curso no existe"));

        courseJpa.setName(requestDTO.name());
        courseJpa.setDescription(requestDTO.description());
        courseJpa.setLevel(requestDTO.level());

        courseRepository.save(courseJpa);
    }

}
