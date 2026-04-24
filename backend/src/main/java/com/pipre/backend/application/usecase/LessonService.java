package com.pipre.backend.application.usecase;

import com.pipre.backend.domain.model.Lesson;
import com.pipre.backend.infrastructure.adapter.in.rest.dto.request.LessonsRequestDTO;
import com.pipre.backend.infrastructure.adapter.out.persistence.repository.LessonRepository;
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
        List<Lesson> lessons = lessonRepository.findAll();
        return lessons.stream()
                .map( lesson -> new LessonsRequestDTO(
                        lesson.getTitle()

                ))
                .toList();
    }

    @Transactional
    public void updateLesson(UUID idLesson, LessonsRequestDTO requestDTO) {
        Lesson lesson = lessonRepository.findById(idLesson)
                .orElseThrow(() -> new RuntimeException("Lección no existe"));

        lesson.setTitle(requestDTO.title());

        lessonRepository.save(lesson);
    }
}
