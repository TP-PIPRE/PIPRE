package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pipre.backend.application.commands.*;
import com.pipre.backend.application.dto.*;
import com.pipre.backend.application.ports.input.*;
import com.pipre.backend.application.ports.output.*;
import com.pipre.backend.domain.entities.course.Course;
import com.pipre.backend.domain.entities.game.*;
import com.pipre.backend.domain.exceptions.BusinessException;
import com.pipre.backend.domain.exceptions.IncompleteGameBoardException;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.pipre.backend.infrastructure.configuration.TutorPilotProperties;
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
    private final VerifiedExercisePointsService points;
    private final AcademicAccessRepositoryPort academicAccess;
    private final GamificationRepositoryPort gamification;
    private final GameSessionHintRepositoryPort hintReceipts;
    private final TutorPilotProperties tutorProperties;
    private final TutorPilotPolicy tutorPilot;
    private final ProgressiveTutorService progressiveTutor;

    @Override @Transactional
    public java.util.Optional<GameSessionDTO> active(String studentId,String game,String template,String activityId,String dailyChallengeId) {
        String canonical=BoardRules.canonicalTemplate(game,template);
        sessions.lockStudent(studentId);
        var found=sessions.active(studentId).filter(s->s.game().equals(game)&&s.levelTemplate().equals(canonical)
            &&Objects.equals(s.activityId(),activityId)&&Objects.equals(s.dailyChallengeId(),dailyChallengeId));
        if(found.isEmpty())return java.util.Optional.empty();
        if(ProceduralDailyService.procedural(dailyChallengeId))procedural.config(studentId,dailyChallengeId,game,canonical,true);
        else if(dailyChallengeId!=null)daily.validate(studentId,dailyChallengeId,game,canonical);
        if(activityId!=null) {
            var activity=activities.findById(activityId).orElseThrow(()->new ResourceNotFoundException("La actividad no existe."));
            if(!game.equals(activity.getEnvironment())||!canonical.equals(BoardRules.canonicalTemplate(activity.getEnvironment(),activity.getLevelTemplate())))
                return java.util.Optional.empty();
            requireUnlocked(studentId, game, found.get().levelNumber(), activityId);
        }
        sessionConfig(found.get());
        return found.map(this::dto);
    }

    @Override @Transactional
    public GameSessionDTO start(StartGameSessionCommand command) {
        String canonical=BoardRules.canonicalTemplate(command.game(),command.levelTemplate());
        int level=Integer.parseInt(canonical.substring(canonical.lastIndexOf('-')+1));
        String clientId=uuid(command.clientSessionId());
        sessions.lockStudent(command.studentId());
        var existing=sessions.findByClientId(command.studentId(),clientId);
        if(existing.isPresent()) {
            var previous=existing.get();
            if(!previous.game().equals(command.game())||!previous.levelTemplate().equals(canonical)
                    ||!Objects.equals(previous.activityId(),command.activityId())||!Objects.equals(previous.dailyChallengeId(),command.dailyChallengeId()))
                throw new BusinessException("El identificador de sesión ya corresponde a otra solicitud.");
            if ("ACTIVE".equals(previous.status()) && previous.activityId() != null) {
                requireUnlocked(command.studentId(), command.game(), level, previous.activityId());
            }
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
            requireUnlocked(command.studentId(), command.game(), level, command.activityId());
        }
        if(command.dailyChallengeId()!=null&&!ProceduralDailyService.procedural(command.dailyChallengeId()))daily.validate(command.studentId(),command.dailyChallengeId(),command.game(),canonical);
        Instant now=clock.instant();sessions.abandonActive(command.studentId(),now);
        if(ProceduralDailyService.procedural(command.dailyChallengeId()))procedural.start(command.dailyChallengeId(),now);
        var state=BoardRules.initialState();
        if (progressiveTutor.applies(command.game(), level, command.activityId(), command.dailyChallengeId())) {
            state.put("neonflow".equals(command.game()) ? "neonFlowProgressiveTutor" : "progressiveTutor", true);
        }
        return dto(sessions.insert(new GameSession(UUID.randomUUID().toString(),clientId,command.studentId(),command.game(),level,canonical,
            command.activityId(),command.dailyChallengeId(),now,null,"ACTIVE",state,0,0,null,null)));
    }

    private void requireUnlocked(String studentId, String game, int level, String activityId) {
        if (level <= 1 || !Course.isOfficial(academicAccess.activityCourse(activityId))) return;
        if (gamification.progress(studentId).stream().noneMatch(previous ->
                previous.game().equals(game) && previous.levelNumber() == level - 1)) {
            throw new BusinessException("Completa el nivel anterior para jugar este reto.");
        }
    }

    @Override @Transactional
    public GameSessionDTO action(String studentId,String sessionId,GameSessionAction action) {
        var session=owned(studentId,sessionId);
        if (action.hintId() != null && !"HELP".equals(action.type()))
            throw new BusinessException("hintId solo puede acompañar una acción HELP.");
        if (action.hintId() != null && action.source() != null)
            throw new BusinessException("Una ayuda contextual no puede declarar su origen.");
        JsonNode payload=json.valueToTree(action);String hash=fingerprint(payload);
        var receipt=sessions.findAction(sessionId,action.sequence());
        if(receipt.isPresent()) {
            if(!hash.equals(receipt.get().hash()) && !compactActionHash(payload).equals(receipt.get().hash()))
                throw new BusinessException("La secuencia ya contiene otra acción.");
            return json.convertValue(receipt.get().response(),GameSessionDTO.class);
        }
        if(!session.status().equals("ACTIVE"))throw new BusinessException("La sesión ya terminó. Inicia otra partida para registrar progreso.");
        progressiveTutor.requireIdle(session);
        if (ProgressiveTutorService.governed(session) && "HELP".equals(action.type())) {
            throw new BusinessException("Solicita las ayudas desde el tutor progresivo de esta partida.");
        }
        if(action.sequence()<1||action.sequence()!=session.revision()+1)throw new BusinessException("La secuencia de acciones no es consecutiva.");
        if(action.sequence()>20000)throw new BusinessException("Se alcanzó el límite de acciones. Inicia otra sesión.");
        JsonNode config=sessionConfig(session);
        JsonNode state;
        if ("HELP".equals(action.type()) && action.hintId() != null) {
            String rejection = validateHintReceipt(session, action);
            if (rejection == null) {
                var groups = tutorPilot.allowedGroups(session);
                if (groups.isEmpty()) rejection = "HINT_SCOPE";
                else if (!hintReceipts.consume(action.hintId(), session.sessionId(), session.revision(), tutorProperties.getMaxHints(), clock.instant(),
                        session.studentId(), session.activityId(), groups)) rejection = "HINT_QUOTA_EXCEEDED";
            }
            if (rejection != null) {
                var rejected = BoardRules.apply(session.game(), config, session.state(),
                        new BoardAction("REJECT", null, null, null, null, null, null, null));
                rejected.put("lastActionRejectionCode", rejection);
                state = rejected;
            } else {
                state = BoardRules.apply(session.game(), config, session.state(),
                        new BoardAction("HELP", null, null, null, null, null, null, null));
            }
        } else {
            state=BoardRules.apply(session.game(), config, session.state(),
                    new BoardAction(action.type(),action.pieceId(),action.x(),action.y(),action.rotation(),action.component(),action.color(),action.source()));
        }
        var changed=session.change(state,action.sequence(),"ACTIVE",null,null,null);
        sessions.update(changed);var response=dto(changed);
        sessions.saveAction(sessionId,action.sequence(),hash,payload,clock.instant(),json.valueToTree(response));
        return response;
    }
    private String validateHintReceipt(GameSession session, GameSessionAction action) {
        var receipt = hintReceipts.findById(action.hintId())
                .orElseThrow(() -> new ResourceNotFoundException("La pista contextual no existe."));
        if (!receipt.sessionId().equals(session.sessionId())) throw new AccessDeniedException("La pista contextual no pertenece a esta sesión.");
        if (receipt.revision() != session.revision()) return "HINT_STALE";
        if (receipt.consumedAt() != null) return "HINT_ALREADY_CONSUMED";
        return null;
    }
    @Override @Transactional(noRollbackFor=IncompleteGameBoardException.class)
    public GameCompletionDTO complete(String studentId,String sessionId) {
        var session=owned(studentId,sessionId);
        if(session.status().equals("COMPLETED")&&session.completionResponse()!=null)
            return json.convertValue(session.completionResponse(),GameCompletionDTO.class);
        if(!session.status().equals("ACTIVE"))throw new BusinessException("La sesión fue abandonada. Inicia otra partida.");
        progressiveTutor.requireIdle(session);
        JsonNode config=sessionConfig(session);
        if(!BoardRules.isSolved(session.game(),config,session.state())) {
            var checked=BoardRules.apply(session.game(),config,session.state(),new BoardAction("CHECK",null,null,null,null,null,null,null));
            sessions.update(session.change(checked,session.revision(),session.status(),null,null,null));
            throw new IncompleteGameBoardException();
        }
        Instant now=clock.instant();
        if(now.isBefore(session.startedAt()))throw new BusinessException("El reloj del servidor requiere sincronización. Inténtalo de nuevo.");
        boolean progressive=ProgressiveTutorService.governed(session);
        int stars=progressive ? BoardRules.stars(session.game(),config,session.state(),progressiveTutor.penalizedHelps(session))
                : BoardRules.stars(session.game(),config,session.state());
        ObjectNode completedState = session.state().deepCopy();
        completedState.put("starsRuleset", BoardRules.STARS_VERSION);
        var completed=session.change(completedState,session.revision(),"COMPLETED",now,stars,null);
        sessions.update(completed);
        var awards=victories.execute(new VerifiedVictory(studentId,sessionId,session.game(),session.levelNumber(),session.levelTemplate(),session.activityId(),session.startedAt(),now,stars,session.dailyChallengeId(),session.startedOrder()));
        var score=progressive ? points.award(completed,config,progressiveTutor.pausedMillis(session,now)) : points.award(completed,config);
        var response=new GameCompletionDTO(sessionId,session.game(),session.levelNumber(),stars,awards.bestStars(),now.toString(),Duration.between(session.startedAt(),now).toMillis(),awards.newAchievements(),awards.daily(),score);
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

    // The original tutor branch omitted null fields when hashing action receipts.
    private String compactActionHash(JsonNode payload) {
        var compact = json.createObjectNode();
        payload.properties().forEach(field -> {
            if (!field.getValue().isNull()) compact.set(field.getKey(), field.getValue());
        });
        return fingerprint(compact);
    }
}
