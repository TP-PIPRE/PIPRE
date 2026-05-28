package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.Module;

import java.util.UUID;

public class ModuleFactory {
    public static Module createNewModule(
            String title,
            String idCourse
    ) {
        return new Module.Builder()
                .idModule(UUID.randomUUID().toString())
                .title(title)
                .idLessonList(null)
                .idCourse(idCourse)
                .build();
    }
}
