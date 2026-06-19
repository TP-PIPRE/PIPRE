package com.pipre.backend.domain.factories;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.pipre.backend.domain.entities.course.Course;
import com.pipre.backend.domain.entities.course.CourseLevel;

public class CourseFactory {
    public static Course createNewCourse(
            String name,
            String description,
            String level,
            List<String> idModuleList) {
        CourseLevel courseLevel = CourseLevel.fromString(level);
        return new Course.Builder()
                .idCourse(UUID.randomUUID().toString())
                .name(name)
                .description(description)
                .level(courseLevel)
                .createdAt(LocalDateTime.now())
                .idModuleList(idModuleList != null ? idModuleList : new ArrayList<>())
                .build();
    }
}
