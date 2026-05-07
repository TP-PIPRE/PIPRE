package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.LessonRequestDTO;
import com.pipre.backend.application.ports.input.CreateLessonsUseCase;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.entities.Lesson;
import com.pipre.backend.domain.factories.LessonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CreateLessonsService implements CreateLessonsUseCase {

    private final LessonRepositoryPort lessonRepositoryPort;

    @Override
    public void execute(LessonRequestDTO requestDTO) {
        Lesson newLesson = LessonFactory.createNewLesson(
                requestDTO.title(),
                null,
                null,
                null,
                requestDTO.idModule()
        );
        lessonRepositoryPort.save(newLesson);
    }
}
