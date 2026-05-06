package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.Course;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class CourseFactory {
    public static Course createNewCourse(
            String name,
            String description,
            String level,
            String objective,
            List<String> idModuleList
    ) {
        return new Course.Builder()
                .idCourse(UUID.randomUUID().toString())
                .name(name)
                .description(description)
                .level(level)
                .objective(objective)
                .createdAt(LocalDateTime.now())
                .idModuleList(idModuleList)
                .build();
    }

}
