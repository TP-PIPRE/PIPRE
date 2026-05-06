package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.Module;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class ModuleFactory {
    public static Module createNewModule(
            String title,
            String description,
            String difficulty,
            Integer moduleOrder,
            List<String> idLessonList,
            String idCourse
    ) {
        return new Module.Builder()
                .idModule(UUID.randomUUID().toString())
                .title(title)
                .description(description)
                .difficulty(difficulty)
                .moduleOrder(moduleOrder)
                .percentageMeta(BigDecimal.valueOf(0))
                .idLessonList(idLessonList)
                .idCourse(idCourse)
                .build();
    }
}
