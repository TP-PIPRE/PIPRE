package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.SimulationJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpaEntity;
import com.pipre.backend.domain.entities.Simulation;

public class SimulationMapper {
    public static SimulationJpaEntity toJpaEntity(com.pipre.backend.domain.entities.Simulation domain) {
        if (domain == null) return null;
        SimulationJpaEntity entity = new SimulationJpaEntity();
        entity.setIdSimulation(domain.getIdSimulation());
        entity.setResult(domain.getResult());
        if (domain.getIdStudent() != null) {
            UserJpaEntity studentEntity = new UserJpaEntity();
            studentEntity.setIdUser(domain.getIdStudent());
            entity.setStudentJpaEntity(studentEntity);
        }

        if (domain.getIdActivity() != null) {
            ActivityJpaEntity activityEntity = new ActivityJpaEntity();
            activityEntity.setIdActivity(domain.getIdActivity());
            entity.setActivityJpaEntity(activityEntity);
        }
        return entity;
    }
    public static com.pipre.backend.domain.entities.Simulation toDomain(SimulationJpaEntity entity) {
        if (entity == null) return null;

        String idStudent = (entity.getStudentJpaEntity() == null)
                ? null
                : entity.getStudentJpaEntity().getIdUser();
        String idActivity = (entity.getActivityJpaEntity() == null)
                ? null
                : entity.getActivityJpaEntity().getIdActivity();

        return Simulation.builder()
                .idSimulation(entity.getIdSimulation())
                .result(entity.getResult())
                .idStudent(idStudent)
                .idActivity(idActivity)
                .build();
    }
}
