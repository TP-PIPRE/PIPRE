package com.pipre.backend.adapters.out.persistence.mapper;

import com.pipre.backend.adapters.out.persistence.jpaEntities.TelemetryAttemptJpaEntity;
import com.pipre.backend.domain.entities.telemetry.TelemetryAttempt;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TelemetryAttemptMapper {

    TelemetryAttemptJpaEntity toJpaEntity(TelemetryAttempt domain);

    TelemetryAttempt toDomain(TelemetryAttemptJpaEntity entity);
}
