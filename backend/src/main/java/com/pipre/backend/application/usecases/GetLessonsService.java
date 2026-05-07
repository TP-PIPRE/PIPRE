package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.LessonResponseDTO;
import com.pipre.backend.application.ports.input.GetLessonsUseCase;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
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
    public List<LessonResponseDTO> execute(String idModule) {
        return lessonRepositoryPort.findAll()
                .stream()
                .map(lesson -> new LessonResponseDTO(
                        lesson.getIdLesson(),
                        lesson.getTitle()
                ))
                .toList();
    }
}
