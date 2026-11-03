package com.pipre.backend.application.ports.output;

import com.pipre.backend.domain.entities.telemetry.TelemetryAttempt;

public interface SaveTelemetryPort {
    void save(TelemetryAttempt attempt);
    default java.util.Optional<TelemetryAttempt> findById(String id) { return java.util.Optional.empty(); }
}
