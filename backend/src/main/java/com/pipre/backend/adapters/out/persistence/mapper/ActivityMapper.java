package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityMissionJpaEntity;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.activity.Mission;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.ArrayList;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ActivityMapper {

    @Mapping(target = "lessonJpaEntity", ignore = true)
    @Mapping(target = "simulationJpaEntityList", ignore = true)
    ActivityJpaEntity toJpaEntity(Activity domain);

    @Mapping(target = "idLesson", source = "lessonJpaEntity.idLesson")
    @Mapping(target = "idSimulationList", source = "simulationJpaEntityList")
    Activity toDomain(ActivityJpaEntity entity);

    @Mapping(source = "id", target = "idMission")
    @Mapping(target = "activityJpaEntity", ignore = true)
    ActivityMissionJpaEntity missionToJpaEntity(Mission domain);

    @Mapping(source = "idMission", target = "id")
    Mission missionToDomain(ActivityMissionJpaEntity entity);

    @AfterMapping
    default void linkMissions(@MappingTarget ActivityJpaEntity entity) {
        if (entity.getMissions() != null) {
            entity.getMissions().forEach(mission -> mission.setActivityJpaEntity(entity));
        }
    }

    default List<String> mapSimulations(List<com.pipre.backend.adapters.out.persistence.jpaEntities.SimulationJpaEntity> simulations) {
        if (simulations == null) {
            return new ArrayList<>();
        }
        return simulations.stream()
                .map(com.pipre.backend.adapters.out.persistence.jpaEntities.SimulationJpaEntity::getIdSimulation)
                .toList();
    }
}
