package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.Activity;

import java.util.UUID;

public class ActivityFactory {
    public static Activity createNewActivity(
            String name,
            String idLesson
    ) {
        return Activity.builder()
                .idActivity(UUID.randomUUID().toString())
                .name(name)
                .idLesson(idLesson)
                .build();
    }
}
