package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.controller.dto.LessonResponseDTO;
import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpa;
import com.pipre.backend.adapters.in.controller.dto.LessonRequestDTO;
import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleJpa;
import com.pipre.backend.adapters.out.persistence.repository.LessonRepository;
import com.pipre.backend.adapters.out.persistence.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LessonService {
    private final LessonRepository lessonRepository;
    private final ModuleRepository moduleRepository;

    @Transactional(readOnly = true)
    public List<LessonResponseDTO> getLessons(UUID idModule) {
        ModuleJpa moduleJpa = moduleRepository.findById(idModule)
                .orElseThrow(() -> new RuntimeException("Módulo no encontrado"));

        return moduleJpa.getLessonJpas().stream()
                .map( lesson -> new LessonResponseDTO(
                        lesson.getIdLesson(),
                        lesson.getTitle()

                ))
                .toList();
    }

    @Transactional
    public void postLesson(LessonRequestDTO requestDTO) {

        ModuleJpa moduleJpa = moduleRepository.findById(requestDTO.idModule())
                .orElseThrow(() -> new RuntimeException("Módulo no encontrado"));

        LessonJpa lessonJpa = LessonJpa.builder()
                .title(requestDTO.title())
                .build();

        moduleJpa.addLesson(lessonJpa);

        lessonRepository.save(lessonJpa);
    }
}
