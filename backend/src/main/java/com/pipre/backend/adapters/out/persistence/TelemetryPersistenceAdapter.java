package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.TelemetryAttemptJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.TelemetryAttemptJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.TelemetryAttemptMapper;
import com.pipre.backend.application.ports.output.SaveTelemetryPort;
import com.pipre.backend.domain.entities.telemetry.TelemetryAttempt;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TelemetryPersistenceAdapter implements SaveTelemetryPort {
    private final TelemetryAttemptJpaRepository telemetryAttemptJpaRepository;
    private final TelemetryAttemptMapper telemetryAttemptMapper;

    @Override
    public void save(TelemetryAttempt attempt) {
        TelemetryAttemptJpaEntity entity = telemetryAttemptMapper.toJpaEntity(attempt);
        telemetryAttemptJpaRepository.save(entity);
    }
}
