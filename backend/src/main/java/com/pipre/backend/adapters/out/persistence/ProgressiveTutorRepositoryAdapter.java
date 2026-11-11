package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.application.ports.output.ProgressiveTutorRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ProgressiveTutorRepositoryAdapter implements ProgressiveTutorRepositoryPort {
    // V31 keeps its original table name. Canonical template IDs distinguish the games.
    private final JdbcTemplate jdbc;

    @Override
    public Optional<Request> find(String sessionId, String requestId) {
        return jdbc.query("SELECT * FROM neonflow_tutor_requests WHERE session_id=? AND request_id=?",
                this::map, sessionId, requestId).stream().findFirst();
    }

    @Override
    public Optional<Request> pending(String studentId, String templateId) {
        return jdbc.query("""
                SELECT * FROM neonflow_tutor_requests
                WHERE student_id=? AND template_id=? AND pending_slot=TRUE
                """, this::map, studentId, templateId).stream().findFirst();
    }

    @Override
    public Optional<Request> lastDelivered(String studentId, String templateId) {
        return jdbc.query("""
                SELECT * FROM neonflow_tutor_requests
                WHERE student_id=? AND template_id=? AND delivered_ordinal IS NOT NULL
                ORDER BY delivered_ordinal DESC LIMIT 1
                """, this::map, studentId, templateId).stream().findFirst();
    }

    @Override
    public List<String> recentMessages(String studentId, String templateId) {
        return jdbc.queryForList("""
                SELECT message FROM neonflow_tutor_requests
                WHERE student_id=? AND template_id=? AND delivered_ordinal IS NOT NULL
                ORDER BY delivered_ordinal DESC LIMIT 8
                """, String.class, studentId, templateId);
    }

    @Override
    public void save(Request request) {
        boolean pending = "PENDING".equals(request.status());
        boolean delivered = "DELIVERED".equals(request.status());
        jdbc.update("""
                INSERT INTO neonflow_tutor_requests(session_id, request_id, student_id, template_id, ordinal, revision,
                    accepted_penalty, source, started_at, expires_at, status, message, finished_at,
                    pending_slot, delivered_ordinal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, request.sessionId(), request.requestId(), request.studentId(), request.templateId(),
                request.ordinal(), request.revision(), request.acceptedPenalty(), request.source(), utc(request.startedAt()),
                utc(request.expiresAt()), request.status(), request.message(), pending ? null : utc(request.startedAt()),
                pending ? Boolean.TRUE : null, delivered ? request.ordinal() : null);
    }

    @Override
    public void finish(String sessionId, String requestId, String message, Instant finishedAt) {
        int changed = jdbc.update("""
                UPDATE neonflow_tutor_requests
                SET status=?, message=?, finished_at=?, pending_slot=NULL,
                    delivered_ordinal=CASE WHEN ? THEN ordinal ELSE NULL END
                WHERE session_id=? AND request_id=? AND pending_slot=TRUE
                """, message == null ? "FAILED" : "DELIVERED", message, utc(finishedAt), message != null,
                sessionId, requestId);
        if (changed != 1) throw new IllegalStateException("La solicitud de ayuda ya no está pendiente.");
    }

    @Override
    public long penaltyCount(String sessionId) {
        return jdbc.queryForObject("""
                SELECT COUNT(*) FROM neonflow_tutor_requests WHERE session_id=? AND delivered_ordinal>8
                """, Long.class, sessionId);
    }

    @Override
    public long pausedMillis(String sessionId, Instant completedAt) {
        var completion = utc(completedAt);
        return jdbc.queryForObject("""
                SELECT CAST(FLOOR(COALESCE(SUM(1000 * EXTRACT(EPOCH FROM
                    (GREATEST(started_at, LEAST(COALESCE(finished_at, expires_at), expires_at,
                        CAST(? AS TIMESTAMP WITH TIME ZONE))) - started_at))), 0)) AS BIGINT)
                FROM neonflow_tutor_requests
                WHERE session_id=? AND source='GENERATIVE' AND (finished_at IS NOT NULL OR expires_at<=?)
                """, Long.class, completion, sessionId, completion);
    }

    private Request map(ResultSet rs, int row) throws SQLException {
        return new Request(rs.getString("session_id"), rs.getString("request_id"), rs.getString("student_id"),
                rs.getString("template_id"), rs.getInt("ordinal"), rs.getInt("revision"),
                rs.getBoolean("accepted_penalty"), rs.getString("source"),
                rs.getObject("started_at", OffsetDateTime.class).toInstant(),
                rs.getObject("expires_at", OffsetDateTime.class).toInstant(), rs.getString("status"),
                rs.getString("message"));
    }

    private static OffsetDateTime utc(Instant value) {
        return value.atOffset(ZoneOffset.UTC);
    }
}
