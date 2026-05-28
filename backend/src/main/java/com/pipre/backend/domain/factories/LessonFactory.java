package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.Lesson;

import java.util.UUID;

public class LessonFactory {
    public static Lesson createNewLesson(
            String title,
            String idModule
    ) {
        return new Lesson.Builder()
                .idLesson(UUID.randomUUID().toString())
                .title(title)
                .idActivityList(null)
                .idModule(idModule)
                .build();
    }
}
