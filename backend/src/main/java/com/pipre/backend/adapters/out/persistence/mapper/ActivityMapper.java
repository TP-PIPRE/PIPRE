package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.SimulationJpaEntity;
import com.pipre.backend.domain.entities.Activity;

import java.util.ArrayList;
import java.util.List;

public class ActivityMapper {
    public static ActivityJpaEntity toJpaEntity(Activity domain) {
        if (domain == null) return null;
        ActivityJpaEntity entity = new ActivityJpaEntity();
        entity.setIdActivity(domain.getIdActivity());
        entity.setName(domain.getName());
        entity.setLogicLevel(domain.getLogicLevel());
        return entity;

    }
    public static Activity toDomain(ActivityJpaEntity entity) {
        String idLesson = (entity.getLessonJpaEntity() == null)
                ? null
                : entity.getLessonJpaEntity().getIdLesson();
        List<String> idimulationList = (entity.getSimulationJpaEntityList() == null)
                ? new ArrayList<>()
                : entity.getSimulationJpaEntityList()
                .stream()
                .map(SimulationJpaEntity::getIdSimulation)
                .toList();
        return Activity.builder()
                .idActivity(entity.getIdActivity())
                .name(entity.getName())
                .logicLevel(entity.getLogicLevel())
                .idSimulationList(idimulationList)
                .idLesson(idLesson)
                .build();
    }

}
