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
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    @Override
    public void save(TelemetryAttempt attempt) {
        if (attempt.getTrace() != null) {
            String body = canonical(attempt.getTrace());
            String fingerprint=attempt.getTrace().path("clientRequestHash").asText();
            String activityId=attempt.getTrace().hasNonNull("activityId")?attempt.getTrace().path("activityId").asText():null;
            jdbc.update("INSERT INTO telemetry_attempts(id_attempt,id_student,game,result,tiempo_resolucion,movimientos,reinicios,pistas_ia,completed_at,trace_context,id_activity,received_at,request_hash) VALUES (?,?,?,?,?,?,?,?,?,?::jsonb,?,CURRENT_TIMESTAMP,?) ON CONFLICT(id_attempt) DO NOTHING",
                attempt.getIdAttempt(),attempt.getStudentId(),attempt.getGame(),attempt.getResult(),attempt.getTiempoResolucion(),attempt.getMovimientos(),attempt.getReinicios(),attempt.getPistasIa(),attempt.getCompletedAt(),body,activityId,fingerprint);
            String stored=jdbc.queryForObject("SELECT request_hash FROM telemetry_attempts WHERE id_attempt=?",String.class,attempt.getIdAttempt());
            if(!fingerprint.equals(stored)) throw new com.pipre.backend.domain.exceptions.BusinessException("El identificador del intento ya contiene otra traza.");
            return;
        }
        TelemetryAttemptJpaEntity entity = telemetryAttemptMapper.toJpaEntity(attempt);
        telemetryAttemptJpaRepository.save(entity);
    }

    @Override public java.util.Optional<TelemetryAttempt> findById(String id) { return telemetryAttemptJpaRepository.findById(id).map(telemetryAttemptMapper::toDomain); }

    private String canonical(com.fasterxml.jackson.databind.JsonNode node) {
        if(node.isArray()) { var items=new java.util.ArrayList<String>();node.forEach(value->items.add(canonical(value)));return "["+String.join(",",items)+"]"; }
        if(node.isObject()) { var fields=new java.util.TreeMap<String,String>();node.fields().forEachRemaining(e->fields.put(e.getKey(),canonical(e.getValue())));return "{"+fields.entrySet().stream().map(e->"\""+e.getKey()+"\":"+e.getValue()).collect(java.util.stream.Collectors.joining(","))+"}"; }
        return node.toString();
    }
}
