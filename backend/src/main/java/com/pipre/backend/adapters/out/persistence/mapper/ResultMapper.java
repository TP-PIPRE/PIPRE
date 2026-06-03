package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ResultJpaEntity;
import com.pipre.backend.domain.entities.Result;

public class ResultMapper {
    public static Result toDomain(ResultJpaEntity entity) {
        if (entity == null) return null;

        String idStudent = (entity.getStudentJpaEntity() == null)
                ? null
                : entity.getStudentJpaEntity().getIdUser();
        String idActivity = (entity.getActivityJpaEntity() == null)
                ? null
                : entity.getActivityJpaEntity().getIdActivity();

        return Result.builder()
                .idResult(entity.getIdResult())
                .attempts(entity.getAttempts())
                .errors(entity.getErrors())
                .idStudent(idStudent)
                .idActivity(idActivity)
                .build();
    }

    public static ResultJpaEntity toEntity(Result domain) {
        if(domain == null) return null;
        ResultJpaEntity entity = new ResultJpaEntity();
        entity.setIdResult(domain.getIdResult());
        entity.setAttempts(domain.getAttempts());
        entity.setErrors(domain.getErrors());
        return entity;
    }
}
