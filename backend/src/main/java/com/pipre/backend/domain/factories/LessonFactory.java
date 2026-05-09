package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.Lesson;

import java.util.List;
import java.util.UUID;

public class LessonFactory {
    public static Lesson createNewLesson(
            String title,
            String content,
            String resourceType,
            List<String>idActivityList,
            String idModule
    ) {
        return new Lesson.Builder()
                .idLesson(UUID.randomUUID().toString())
                .title(title)
                .content(content)
                .resourceType(resourceType)
                .idActivityList(idActivityList)
                .idModule(idModule)
                .build();
    }
}
