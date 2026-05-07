package com.pipre.backend.application.useCases;

import com.pipre.backend.adapters.in.web.dto.CreateLessonCommand;
import com.pipre.backend.application.ports.input.CreateLessonUseCase;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.entities.Lesson;
import com.pipre.backend.domain.factories.LessonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CreateLessonService implements CreateLessonUseCase {

    private final LessonRepositoryPort lessonRepositoryPort;

    @Override
    public String execute(CreateLessonCommand cmd) {
        Lesson newLesson = LessonFactory.createNewLesson(
                cmd.title(),
                null,
                null,
                null,
                cmd.idModule()
        );
        lessonRepositoryPort.save(newLesson);
        return newLesson.getIdLesson();
    }
}
