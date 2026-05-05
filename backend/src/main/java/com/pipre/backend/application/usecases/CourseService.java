package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpaEntity;
import com.pipre.backend.adapters.in.web.dto.CourseRequestDTO;
import com.pipre.backend.adapters.in.web.dto.CourseResponseDTO;
import com.pipre.backend.adapters.out.persistence.repository.CourseJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

//@Service
//@RequiredArgsConstructor
public class CourseService {
//
//    private final CourseJpaRepository courseJpaRepository;
//
//    @Transactional(readOnly = true)
//    public List<CourseResponseDTO> getCourse() {
//        List<CourseJpaEntity> cours = courseJpaRepository.findAll();
//        return cours.stream()
//                .map(courseJpaEntity -> new CourseResponseDTO(
//                        courseJpaEntity.getIdCourse(),
//                        courseJpaEntity.getName()
//                ))
//                .toList();
//    }
//
//    @Transactional
//    public void postCourse(CourseRequestDTO requestDTO) {
//        CourseJpaEntity courseJpaEntity = new CourseJpaEntity(
//                null,
//                requestDTO.name(),
//                requestDTO.description(),
//                requestDTO.level(),
//                "Aprendizaje de robótica",
//                LocalDateTime.now(),
//                null
//        );
//        courseJpaRepository.save(courseJpaEntity);
//    }
//
//    @Transactional
//    public void updateCourse(UUID idCourse, CourseRequestDTO requestDTO) {
//        CourseJpaEntity courseJpaEntity = courseJpaRepository.findById(idCourse)
//                .orElseThrow(() -> new RuntimeException("Curso no existe"));
//
//        courseJpaEntity.setName(requestDTO.name());
//        courseJpaEntity.setDescription(requestDTO.description());
//        courseJpaEntity.setLevel(requestDTO.level());
//
//        courseJpaRepository.save(courseJpaEntity);
//    }

}
