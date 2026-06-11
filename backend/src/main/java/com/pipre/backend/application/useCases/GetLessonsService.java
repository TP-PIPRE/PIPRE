package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.LessonDTO;
import com.pipre.backend.application.ports.input.GetLessonsUseCase;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.entities.lesson.Lesson;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetLessonsService implements GetLessonsUseCase {
    private final LessonRepositoryPort lessonRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public List<LessonDTO> execute(String idModule) {
        return lessonRepositoryPort.findAll()
                .stream()
                .filter(lesson -> idModule.equals(lesson.getIdModule()))
                .map(lesson -> new LessonDTO(
                        lesson.getIdLesson(),
                        lesson.getTitle()
                ))
                .toList();
    }
}
