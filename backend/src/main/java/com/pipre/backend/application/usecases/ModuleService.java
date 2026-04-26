package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.controller.dto.ModuleRequestDTO;
import com.pipre.backend.adapters.in.controller.dto.ModuleResponseDTO;
import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpa;
import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleJpa;
import com.pipre.backend.adapters.out.persistence.repository.CourseRepository;
import com.pipre.backend.adapters.out.persistence.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ModuleService {


    private final ModuleRepository moduleRepository;
    private final CourseRepository courseRepository;

    public List<ModuleResponseDTO> getModule(UUID id) {
        CourseJpa course =  courseRepository.findByIdCourse(id);
        return course.getModuleJpas().stream()
                .map(moduleJpa -> new ModuleResponseDTO(
                        moduleJpa.getIdModule(),
                        moduleJpa.getTitle()
                ))
                .toList();
    }

    public void postModule(ModuleRequestDTO requestDTO) {
        CourseJpa courseJpa = courseRepository.findById(requestDTO.idCourse())
                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));
        ModuleJpa moduleJpa = ModuleJpa.builder()
                .title(requestDTO.title())
                .description("Nuevo módulo")
                .build();
        courseJpa.addModule(moduleJpa);
        courseRepository.save(courseJpa);
    }
}
