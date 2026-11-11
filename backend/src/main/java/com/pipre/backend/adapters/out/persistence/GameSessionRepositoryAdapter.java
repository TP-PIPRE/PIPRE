package com.pipre.backend.adapters.out.persistence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.ports.output.GameSessionRepositoryPort;
import com.pipre.backend.domain.entities.game.GameSession;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
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
public class GameSessionRepositoryAdapter implements GameSessionRepositoryPort {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public void lockStudent(String studentId) {
        if(jdbc.queryForList("SELECT id_user FROM users WHERE id_user=? FOR UPDATE",String.class,studentId).isEmpty())
            throw new ResourceNotFoundException("El estudiante no existe.");
    }
    public Optional<GameSession> findByClientId(String studentId,String clientSessionId) {
        return jdbc.query("SELECT * FROM game_sessions WHERE student_id=? AND client_session_id=?",this::map,studentId,clientSessionId).stream().findFirst();
    }
    public Optional<GameSession> active(String studentId) {
        return jdbc.query("SELECT * FROM game_sessions WHERE active_student_id=? AND status='ACTIVE'",this::map,studentId).stream().findFirst();
    }
    public Optional<GameSession> lockSession(String sessionId) {
        return jdbc.query("SELECT * FROM game_sessions WHERE session_id=? FOR UPDATE",this::map,sessionId).stream().findFirst();
    }
    public void abandonActive(String studentId,Instant now) {
        jdbc.update("UPDATE game_sessions SET status='ABANDONED',active_student_id=NULL,completed_at=? WHERE student_id=? AND status='ACTIVE'",utc(now),studentId);
    }
    public GameSession insert(GameSession session) {
        jdbc.update("INSERT INTO game_sessions(session_id,client_session_id,student_id,active_student_id,game,level_number,level_template,activity_id,daily_challenge_id,started_at,status,state,revision) VALUES (?,?,?,?,?,?,?,?,?,?,? ,"+jsonParameter()+",?)",
            session.sessionId(),session.clientSessionId(),session.studentId(),session.studentId(),session.game(),session.levelNumber(),session.levelTemplate(),session.activityId(),session.dailyChallengeId(),utc(session.startedAt()),session.status(),encode(session.state()),session.revision());
        return lockSession(session.sessionId()).orElseThrow();
    }
    public void update(GameSession session) {
        jdbc.update("UPDATE game_sessions SET state="+jsonParameter()+",revision=?,status=?,active_student_id=?,completed_at=?,stars=?,completion_response="+jsonParameter()+" WHERE session_id=?",
            encode(session.state()),session.revision(),session.status(),session.status().equals("ACTIVE")?session.studentId():null,utc(session.completedAt()),session.stars(),encode(session.completionResponse()),session.sessionId());
    }
    public Optional<ActionReceipt> findAction(String sessionId,int sequence) {
        return jdbc.query("SELECT payload_hash,response FROM game_session_actions WHERE session_id=? AND sequence=?",
            (rs,row)->new ActionReceipt(rs.getString(1),decode(rs.getString(2))),sessionId,sequence).stream().findFirst();
    }
    public List<JsonNode> recentActions(String sessionId) {
        return jdbc.query("SELECT payload FROM game_session_actions WHERE session_id=? ORDER BY sequence DESC LIMIT 6",
                (rs,row)->decode(rs.getString(1)),sessionId);
    }
    public void saveAction(String sessionId,int sequence,String hash,JsonNode payload,Instant receivedAt,JsonNode response) {
        jdbc.update("INSERT INTO game_session_actions(session_id,sequence,payload_hash,payload,received_at,response) VALUES (?,?,?,"+jsonParameter()+",?,"+jsonParameter()+")",
            sessionId,sequence,hash,encode(payload),utc(receivedAt),encode(response));
    }
    private GameSession map(ResultSet rs,int row) throws SQLException {
        return new GameSession(rs.getString("session_id"),rs.getString("client_session_id"),rs.getString("student_id"),
            rs.getString("game"),rs.getInt("level_number"),rs.getString("level_template"),rs.getString("activity_id"),rs.getString("daily_challenge_id"),
            instant(rs,"started_at"),instant(rs,"completed_at"),rs.getString("status"),decode(rs.getString("state")),rs.getInt("revision"),
            rs.getLong("started_order"),(Integer)rs.getObject("stars"),decode(rs.getString("completion_response")));
    }
    private Instant instant(ResultSet rs,String name) throws SQLException { var value=rs.getObject(name,OffsetDateTime.class);return value==null?null:value.toInstant(); }
    private OffsetDateTime utc(Instant value) { return value==null?null:value.atOffset(ZoneOffset.UTC); }
    private String encode(JsonNode value) { return value==null?null:value.toString(); }
    private JsonNode decode(String value) {
        if(value==null)return null;
        try { return json.readTree(value); }
        catch(JsonProcessingException e) { throw new IllegalStateException("La sesión contiene JSON inválido.",e); }
    }
    private String jsonParameter() {
        String product=jdbc.execute((org.springframework.jdbc.core.ConnectionCallback<String>)c->c.getMetaData().getDatabaseProductName());
        return "H2".equals(product)?"? FORMAT JSON":"CAST(? AS JSONB)";
    }
}
