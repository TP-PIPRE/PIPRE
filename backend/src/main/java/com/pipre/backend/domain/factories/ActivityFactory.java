package com.pipre.backend.domain.factories;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.activity.ActivityLevel;
import com.pipre.backend.domain.entities.activity.Mission;

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

    public static Activity createNewActivity(
            String name,
            String idLesson,
            ActivityLevel logicLevel,
            String complexity,
            String difficulty,
            String type,
            String environment,
            Double startX,
            Double startZ,
            Double targetX,
            Double targetZ,
            List<Mission> missions) {
        return Activity.builder()
                .idActivity(UUID.randomUUID().toString())
                .name(name)
                .idLesson(idLesson)
                .logicLevel(logicLevel)
                .complexity(complexity)
                .difficulty(difficulty)
                .type(type)
                .environment(environment)
                .startX(startX)
                .startZ(startZ)
                .targetX(targetX)
                .targetZ(targetZ)
                .missions(missions)
                .idSimulationList(new ArrayList<>())
                .build();
    }
}
