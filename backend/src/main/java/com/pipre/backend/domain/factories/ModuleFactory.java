package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.module.Module;

import java.util.List;
import java.util.UUID;

public class ModuleFactory {
    public static Module createNewModule(
            String title,
            String idCourse
    ) {
        return Module.builder()
                .idModule(UUID.randomUUID().toString())
                .title(title)
                .idLessonList(List.of())
                .idCourse(idCourse)
                .build();
    }
}
