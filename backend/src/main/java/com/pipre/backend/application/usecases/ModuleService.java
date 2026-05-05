package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.ModuleRequestDTO;
import com.pipre.backend.adapters.in.web.dto.ModuleResponseDTO;
import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleJpaEntity;
import com.pipre.backend.adapters.out.persistence.repository.CourseJpaRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
//
//@Service
//@RequiredArgsConstructor
public class ModuleService {
//
//    private final CourseJpaRepository courseJpaRepository;
//
//    @Transactional(readOnly = true)
//    public List<ModuleResponseDTO> getModule(UUID id) {
//        CourseJpaEntity course =  courseJpaRepository.findByIdCourse(id);
//        return course.getModuleJpas().stream()
//                .map(moduleJpa -> new ModuleResponseDTO(
//                        moduleJpa.getIdModule(),
//                        moduleJpa.getTitle()
//                ))
//                .toList();
//    }
//
//    @Transactional
//    public void postModule(ModuleRequestDTO requestDTO) {
//        CourseJpaEntity courseJpaEntity = courseJpaRepository.findById(requestDTO.idCourse())
//                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));
//        ModuleJpaEntity moduleJpaEntity = ModuleJpaEntity.builder()
//                .title(requestDTO.title())
//                .description("Nuevo módulo")
//                .build();
//        courseJpaEntity.addModule(moduleJpaEntity);
//        courseJpaRepository.save(courseJpaEntity);
//    }
}
