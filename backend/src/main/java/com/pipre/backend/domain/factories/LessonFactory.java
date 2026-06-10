package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.lesson.Lesson;

import java.util.List;
import java.util.UUID;

public class LessonFactory {
    public static Lesson createNewLesson(
            String title,
            String idModule
    ) {
        return Lesson.builder()
                .idLesson(UUID.randomUUID().toString())
                .title(title)
                .idActivityList(List.of())
                .idModule(idModule)
                .build();
    }
}
