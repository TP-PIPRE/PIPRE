package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.commands.*;
import com.pipre.backend.application.dto.*;
import com.pipre.backend.application.ports.input.*;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.game.*;
import com.pipre.backend.domain.exceptions.BusinessException;
import com.pipre.backend.domain.exceptions.IncompleteGameBoardException;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameSessionsService implements GameSessionsUseCase {
    private final GameSessionRepositoryPort sessions;
    private final TetriLogicTemplateRepositoryPort tetriTemplates;
    private final NeonFlowTemplateRepositoryPort neonTemplates;
    private final ActivityRepositoryPort activities;
    private final DailyChallengeUseCase daily;
    private final RecordVerifiedVictoryUseCase victories;
    private final ObjectMapper json;
    private final Clock clock;
    private final ProceduralDailyService procedural;

    @Override @Transactional
    public GameSessionDTO start(StartGameSessionCommand command) {
        String canonical=BoardRules.canonicalTemplate(command.game(),command.levelTemplate());
        String clientId=uuid(command.clientSessionId());
        sessions.lockStudent(command.studentId());
        var existing=sessions.findByClientId(command.studentId(),clientId);
        if(existing.isPresent()) {
            var previous=existing.get();
            if(!previous.game().equals(command.game())||!previous.levelTemplate().equals(canonical)
                    ||!Objects.equals(previous.activityId(),command.activityId())||!Objects.equals(previous.dailyChallengeId(),command.dailyChallengeId()))
                throw new BusinessException("El identificador de sesión ya corresponde a otra solicitud.");
            return dto(previous); // Never resurrect a completed or abandoned session.
        }
        if(ProceduralDailyService.procedural(command.dailyChallengeId())) {
            if(command.activityId()!=null)throw new BusinessException("Un reto diario no es una actividad del catálogo.");
            procedural.config(command.studentId(),command.dailyChallengeId(),command.game(),canonical,true);
        } else config(command.game(),canonical);
        if(command.activityId()!=null) {
            var activity=activities.findById(command.activityId()).orElseThrow(()->new ResourceNotFoundException("La actividad no existe."));
            if(!command.game().equals(activity.getEnvironment())||!canonical.equals(BoardRules.canonicalTemplate(activity.getEnvironment(),activity.getLevelTemplate())))
                throw new BusinessException("La actividad no corresponde al tablero solicitado.");
        }
        if(command.dailyChallengeId()!=null&&!ProceduralDailyService.procedural(command.dailyChallengeId()))daily.validate(command.studentId(),command.dailyChallengeId(),command.game(),canonical);
        Instant now=clock.instant();sessions.abandonActive(command.studentId(),now);
        if(ProceduralDailyService.procedural(command.dailyChallengeId()))procedural.start(command.dailyChallengeId(),now);
        int level=Integer.parseInt(canonical.substring(canonical.lastIndexOf('-')+1));
        return dto(sessions.insert(new GameSession(UUID.randomUUID().toString(),clientId,command.studentId(),command.game(),level,canonical,
            command.activityId(),command.dailyChallengeId(),now,null,"ACTIVE",BoardRules.initialState(),0,0,null,null)));
    }
    @Override @Transactional
    public GameSessionDTO action(String studentId,String sessionId,GameSessionAction action) {
        var session=owned(studentId,sessionId);
        JsonNode payload=json.valueToTree(action);String hash=fingerprint(payload);
        var receipt=sessions.findAction(sessionId,action.sequence());
        if(receipt.isPresent()) {
            if(!hash.equals(receipt.get().hash()))throw new BusinessException("La secuencia ya contiene otra acción.");
            return json.convertValue(receipt.get().response(),GameSessionDTO.class);
        }
        if(!session.status().equals("ACTIVE"))throw new BusinessException("La sesión ya terminó. Inicia otra partida para registrar progreso.");
        if(action.sequence()<1||action.sequence()!=session.revision()+1)throw new BusinessException("La secuencia de acciones no es consecutiva.");
        if(action.sequence()>20000)throw new BusinessException("Se alcanzó el límite de acciones. Inicia otra sesión.");
        var state=BoardRules.apply(session.game(),sessionConfig(session),session.state(),
            new BoardAction(action.type(),action.pieceId(),action.x(),action.y(),action.rotation(),action.component(),action.color(),action.source()));
        var changed=session.change(state,action.sequence(),"ACTIVE",null,null,null);
        sessions.update(changed);var response=dto(changed);
        sessions.saveAction(sessionId,action.sequence(),hash,payload,clock.instant(),json.valueToTree(response));
        return response;
    }
    @Override @Transactional(noRollbackFor=IncompleteGameBoardException.class)
    public GameCompletionDTO complete(String studentId,String sessionId) {
        var session=owned(studentId,sessionId);
        if(session.status().equals("COMPLETED")&&session.completionResponse()!=null)
            return json.convertValue(session.completionResponse(),GameCompletionDTO.class);
        if(!session.status().equals("ACTIVE"))throw new BusinessException("La sesión fue abandonada. Inicia otra partida.");
        JsonNode config=sessionConfig(session);
        if(!BoardRules.isSolved(session.game(),config,session.state())) {
            var checked=BoardRules.apply(session.game(),config,session.state(),new BoardAction("CHECK",null,null,null,null,null,null,null));
            sessions.update(session.change(checked,session.revision(),session.status(),null,null,null));
            throw new IncompleteGameBoardException();
        }
        Instant now=clock.instant();
        if(now.isBefore(session.startedAt()))throw new BusinessException("El reloj del servidor requiere sincronización. Inténtalo de nuevo.");
        int stars=BoardRules.stars(session.game(),config,session.state());
        var completed=session.change(session.state(),session.revision(),"COMPLETED",now,stars,null);
        sessions.update(completed);
        var awards=victories.execute(new VerifiedVictory(studentId,sessionId,session.game(),session.levelNumber(),session.levelTemplate(),session.activityId(),session.startedAt(),now,stars,session.dailyChallengeId(),session.startedOrder()));
        var response=new GameCompletionDTO(sessionId,session.game(),session.levelNumber(),stars,awards.bestStars(),now.toString(),Duration.between(session.startedAt(),now).toMillis(),awards.newAchievements(),awards.daily());
        sessions.update(completed.change(completed.state(),completed.revision(),completed.status(),now,stars,json.valueToTree(response)));
        return response;
    }
    private GameSession owned(String studentId,String sessionId) {
        sessions.lockStudent(studentId); // Global lock order shared with achievement evaluation.
        var session=sessions.lockSession(sessionId).orElseThrow(()->new ResourceNotFoundException("La sesión no existe."));
        if(!session.studentId().equals(studentId))throw new AccessDeniedException("No puedes modificar una partida de otro estudiante.");
        return session;
    }
    private JsonNode config(String game,String template) {
        Object value=game.equals("tetrilogic")
            ?tetriTemplates.findById(template).orElseThrow(()->new ResourceNotFoundException("El tablero no está disponible.")).config()
            :neonTemplates.findById(template).orElseThrow(()->new ResourceNotFoundException("El tablero no está disponible.")).config();
        return json.valueToTree(value);
    }
    private JsonNode sessionConfig(GameSession session) {
        return ProceduralDailyService.procedural(session.dailyChallengeId())
            ? procedural.config(session.studentId(),session.dailyChallengeId(),session.game(),session.levelTemplate(),false)
            : config(session.game(),session.levelTemplate());
    }
    private GameSessionDTO dto(GameSession s) { return new GameSessionDTO(s.sessionId(),s.game(),s.levelNumber(),s.levelTemplate(),BoardRules.ruleset(s.game()),s.startedAt().toString(),s.status(),s.state(),s.revision()); }
    private String uuid(String value) {
        try { String normalized=UUID.fromString(value).toString();if(!normalized.equalsIgnoreCase(value))throw new IllegalArgumentException();return normalized; }
        catch(IllegalArgumentException|NullPointerException e) { throw new BusinessException("El identificador de cliente no es un UUID válido."); }
    }
    private String fingerprint(JsonNode value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(TelemetryFingerprint.canonical(value).getBytes(StandardCharsets.UTF_8))); }
        catch(java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
