package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.SimulationJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpaEntity;
import com.pipre.backend.domain.entities.simulation.Simulation;
import com.pipre.backend.domain.entities.simulation.SimulationResult;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SimulationMapper {

    @Mapping(target = "studentJpaEntity", source = "idStudent")
    @Mapping(target = "activityJpaEntity", source = "idActivity")
    SimulationJpaEntity toJpaEntity(Simulation domain);

    @Mapping(target = "idStudent", source = "studentJpaEntity.idUser")
    @Mapping(target = "idActivity", source = "activityJpaEntity.idActivity")
    Simulation toDomain(SimulationJpaEntity entity);

    default UserJpaEntity mapStudent(String idStudent) {
        if (idStudent == null) return null;
        UserJpaEntity entity = new UserJpaEntity();
        entity.setIdUser(idStudent);
        return entity;
    }

    default ActivityJpaEntity mapActivity(String idActivity) {
        if (idActivity == null) return null;
        ActivityJpaEntity entity = new ActivityJpaEntity();
        entity.setIdActivity(idActivity);
        return entity;
    }

    default String mapResult(SimulationResult result) {
        return result != null ? result.name() : null;
    }

    default SimulationResult mapResult(String result) {
        return result != null ? SimulationResult.fromString(result) : null;
    }
}
