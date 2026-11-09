package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.application.ports.output.GameSessionHintRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class GameSessionHintRepositoryAdapter implements GameSessionHintRepositoryPort {
    private final JdbcTemplate jdbc;

    @Override
    public Optional<HintReceipt> findByRequest(String sessionId, String requestId) {
        return jdbc.query("SELECT * FROM game_session_hints WHERE session_id=? AND request_id=?",
                this::map, sessionId, requestId).stream().findFirst();
    }

    @Override
    public Optional<HintReceipt> findById(String hintId) {
        return jdbc.query("SELECT * FROM game_session_hints WHERE hint_id=?", this::map, hintId).stream().findFirst();
    }

    @Override
    public long countConsumed(String sessionId) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM game_session_hints WHERE session_id=? AND consumed_at IS NOT NULL AND source='RULE_BASED'", Long.class, sessionId);
        return count == null ? 0 : count;
    }

    @Override
    public long countConsumedForDiagnosis(String sessionId, String diagnosisKey) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM game_session_hints WHERE session_id=? AND diagnosis_key=? AND consumed_at IS NOT NULL AND source='RULE_BASED'", Long.class, sessionId, diagnosisKey);
        return count == null ? 0 : count;
    }

    @Override
    public long countPendingSince(String sessionId, Instant since) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM game_session_hints WHERE session_id=? AND consumed_at IS NULL AND created_at>?", Long.class, sessionId, utc(since));
        return count == null ? 0 : count;
    }

    @Override
    public void purgePendingBefore(Instant before) {
        jdbc.update("DELETE FROM game_session_hints WHERE consumed_at IS NULL AND created_at<?", utc(before));
    }

    @Override
    public boolean consume(String hintId, String sessionId, int revision, int maxHints, Instant consumedAt) {
        return jdbc.update("UPDATE game_session_hints SET consumed_at=? WHERE hint_id=? AND session_id=? AND revision=? AND source='RULE_BASED' AND consumed_at IS NULL AND (SELECT COUNT(*) FROM game_session_hints WHERE session_id=? AND source='RULE_BASED' AND consumed_at IS NOT NULL) < ?", utc(consumedAt), hintId, sessionId, revision, sessionId, maxHints) == 1;
    }

    @Override
    public void save(HintReceipt receipt) {
        jdbc.update("INSERT INTO game_session_hints(hint_id,session_id,request_id,request_hash,diagnosis_key,revision,locale,source,hint_level,hint_type,message,target_x,target_y,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT (session_id,request_id) DO NOTHING",
                receipt.hintId(), receipt.sessionId(), receipt.requestId(), receipt.requestHash(), receipt.diagnosisKey(),
                receipt.revision(), receipt.locale(), receipt.source(), receipt.hintLevel(), receipt.type(), receipt.message(),
                receipt.targetX(), receipt.targetY(), utc(receipt.createdAt()));
    }

    private HintReceipt map(ResultSet rs, int row) throws SQLException {
        return new HintReceipt(
                rs.getString("hint_id"), rs.getString("session_id"), rs.getString("request_id"),
                rs.getString("request_hash"), rs.getString("diagnosis_key"), rs.getInt("revision"),
                rs.getString("locale"), rs.getString("source"), rs.getInt("hint_level"),
                rs.getString("hint_type"), rs.getString("message"),
                (Integer) rs.getObject("target_x"), (Integer) rs.getObject("target_y"),
                instant(rs, "created_at"), instant(rs, "consumed_at"));
    }

    private OffsetDateTime utc(Instant value) { return value == null ? null : value.atOffset(ZoneOffset.UTC); }
    private Instant instant(ResultSet rs, String name) throws SQLException {
        OffsetDateTime value = rs.getObject(name, OffsetDateTime.class);
        return value == null ? null : value.toInstant();
    }
}
