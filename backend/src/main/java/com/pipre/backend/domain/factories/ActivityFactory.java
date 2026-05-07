package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.Activity;

import java.util.List;
import java.util.UUID;

public class ActivityFactory {
    public static Activity createNewActivity(
            String name,
            String difficulty,
            Integer logicLevel,
            String type,
            List<String> idimulationList,
            String idLesson
    ) {
        return new Activity.Builder()
                .idActivity(UUID.randomUUID().toString())
                .name(name)
                .difficulty(difficulty)
                .logicLevel(logicLevel)
                .type(type)
                .idimulationList(idimulationList)
                .idLesson(idLesson)
                .build();
    }
}
