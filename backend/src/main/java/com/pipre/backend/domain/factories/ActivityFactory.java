package com.pipre.backend.domain.factories;

import java.util.ArrayList;
import java.util.UUID;

import com.pipre.backend.domain.entities.activity.Activity;

public class ActivityFactory {
    public static Activity createNewActivity(
            String name,
            String idLesson) {
        return Activity.builder()
                .idActivity(UUID.randomUUID().toString())
                .name(name)
                .idLesson(idLesson)
                .idSimulationList(new ArrayList<>())
                .build();
    }
}
