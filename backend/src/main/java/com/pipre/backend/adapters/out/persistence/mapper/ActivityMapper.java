package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.SimulationJpaEntity;
import com.pipre.backend.domain.entities.activity.Activity;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

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

    default List<String> mapSimulations(List<SimulationJpaEntity> simulations) {
        if (simulations == null) {
            return new ArrayList<>();
        }
        return simulations.stream()
                .map(SimulationJpaEntity::getIdSimulation)
                .toList();
    }
}
