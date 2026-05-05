package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.LessonResponseDTO;
import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpaEntity;
import com.pipre.backend.adapters.in.web.dto.LessonRequestDTO;
import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleJpaEntity;
import com.pipre.backend.adapters.out.persistence.repository.LessonJpaRepository;
import com.pipre.backend.adapters.out.persistence.repository.ModuleJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

//@Service
//@RequiredArgsConstructor
public class LessonService {
//    private final LessonJpaRepository lessonJpaRepository;
//    private final ModuleJpaRepository moduleJpaRepository;
//
//    @Transactional(readOnly = true)
//    public List<LessonResponseDTO> getLessons(UUID idModule) {
//        ModuleJpaEntity moduleJpaEntity = moduleJpaRepository.findById(idModule)
//                .orElseThrow(() -> new RuntimeException("Módulo no encontrado"));
//
//        return moduleJpaEntity.getLessonJpas().stream()
//                .map( lesson -> new LessonResponseDTO(
//                        lesson.getIdLesson(),
//                        lesson.getTitle()
//
//                ))
//                .toList();
//    }
//
//    @Transactional
//    public void postLesson(LessonRequestDTO requestDTO) {
//
//        ModuleJpaEntity moduleJpaEntity = moduleJpaRepository.findById(requestDTO.idModule())
//                .orElseThrow(() -> new RuntimeException("Módulo no encontrado"));
//
//        LessonJpaEntity lessonJpaEntity = LessonJpaEntity.builder()
//                .title(requestDTO.title())
//                .build();
//
//        moduleJpaEntity.addLesson(lessonJpaEntity);
//
//        lessonJpaRepository.save(lessonJpaEntity);
//    }
}
