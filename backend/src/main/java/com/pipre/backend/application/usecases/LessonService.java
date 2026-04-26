package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpa;
import com.pipre.backend.adapters.in.controller.dto.LessonsRequestDTO;
import com.pipre.backend.adapters.out.persistence.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LessonService {
    private final LessonRepository lessonRepository;

    public List<LessonsRequestDTO> getLessons() {
        List<LessonJpa> lessonJpas = lessonRepository.findAll();
        return lessonJpas.stream()
                .map( lesson -> new LessonsRequestDTO(
                        lesson.getTitle()

                ))
                .toList();
    }

    @Transactional
    public void updateLesson(UUID idLesson, LessonsRequestDTO requestDTO) {
        LessonJpa lessonJpa = lessonRepository.findById(idLesson)
                .orElseThrow(() -> new RuntimeException("Lección no existe"));

        lessonJpa.setTitle(requestDTO.title());

        lessonRepository.save(lessonJpa);
    }
}
