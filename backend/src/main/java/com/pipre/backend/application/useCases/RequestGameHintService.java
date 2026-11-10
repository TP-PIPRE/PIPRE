package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.commands.RequestGameHintCommand;
import com.pipre.backend.application.dto.GameHintDTO;
import com.pipre.backend.application.ports.input.RequestGameHintUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.GameSessionHintRepositoryPort;
import com.pipre.backend.application.ports.output.GameSessionRepositoryPort;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.application.ports.output.ModuleRepositoryPort;
import com.pipre.backend.application.ports.output.TutorPilotAccessPort;
import com.pipre.backend.application.ports.output.NeonFlowTemplateRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.game.BoardRules;
import com.pipre.backend.domain.entities.game.GameSession;
import com.pipre.backend.domain.entities.game.NeonHintDiagnosis;
import com.pipre.backend.domain.exceptions.BusinessException;
import com.pipre.backend.domain.exceptions.GameHintPendingException;
import com.pipre.backend.domain.exceptions.GameHintStaleException;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import com.pipre.backend.infrastructure.configuration.TutorPilotProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RequestGameHintService implements RequestGameHintUseCase {
    private final GameSessionRepositoryPort sessions;
    private final GameSessionHintRepositoryPort hints;
    private final TutorPilotAccessPort pilotAccess;
    private final NeonFlowTemplateRepositoryPort neonTemplates;
    private final ActivityRepositoryPort activities;
    private final LessonRepositoryPort lessons;
    private final ModuleRepositoryPort modules;
    private final ObjectMapper json;
    private final TutorPilotProperties properties;

    @Override
    @Transactional
    public GameHintDTO execute(String studentId, String sessionId, RequestGameHintCommand command) {
        if (!properties.isEnabled()) throw new BusinessException("El tutor contextual no está habilitado.");
        validateUuid(command.requestId());
        GameSession session = ownedSession(studentId, sessionId);
        if (session.dailyChallengeId() != null) {
            throw new BusinessException("Los retos diarios conservan únicamente la ayuda estática.");
        }
        if (!"neonflow".equals(session.game()) || session.activityId() == null) {
            throw new BusinessException("La pista contextual solo está disponible para Neon Flow oficial.");
        }
        Activity activity = activities.findById(session.activityId())
                .orElseThrow(() -> new BusinessException("La actividad de la sesión no existe."));
        String courseId = lessons.findAll().stream()
                .filter(lesson -> lesson.getIdLesson().equals(activity.getIdLesson()))
                .findFirst()
                .flatMap(lesson -> modules.findById(lesson.getIdModule()))
                .map(module -> module.getIdCourse())
                .orElseThrow(() -> new BusinessException("La actividad no está asociada a un curso."));
        if (!"c001".equals(courseId) || !"neonflow".equals(activity.getEnvironment())
                || !BoardRules.canonicalTemplate("neonflow", activity.getLevelTemplate()).equals(session.levelTemplate())) {
            throw new BusinessException("La actividad no pertenece al catálogo oficial del piloto.");
        }
        if (properties.getAllowedActivityIds().isEmpty() || properties.getAllowedGroupIds().isEmpty()) {
            throw new BusinessException("El piloto requiere actividades y grupos autorizados.");
        }
        if (!properties.getAllowedActivityIds().contains(activity.getIdActivity())) {
            throw new BusinessException("La actividad no está habilitada para el piloto.");
        }
        if (!pilotAccess.isStudentAssignedToActivity(studentId, activity.getIdActivity(), SetSupport.asSet(properties.getAllowedGroupIds()))) {
            throw new BusinessException("El estudiante no pertenece al grupo habilitado para el piloto.");
        }
        if (!"es".equalsIgnoreCase(command.locale())) throw new BusinessException("El piloto solo admite locale es.");
        if (!"ACTIVE".equals(session.status())) throw new BusinessException("La sesión ya no está activa.");
        String locale = command.locale().toLowerCase(Locale.ROOT);
        String hash = hash(command.requestId() + "|" + command.revision() + "|" + locale);
        var previous = hints.findByRequest(sessionId, command.requestId());
        if (previous.isPresent()) {
            if (!hash.equals(previous.get().requestHash())) throw new BusinessException("La solicitud ya fue utilizada con otros datos.");
            return dto(previous.get());
        }
        if (command.revision() != session.revision()) throw new GameHintStaleException(command.revision(), session.revision());
        Instant now = Instant.now();
        hints.purgePendingExceptRevision(sessionId, command.revision());
        if (hints.countPending(sessionId, command.revision()) > 0) {
            throw new GameHintPendingException();
        }

        JsonNode config = neonTemplates.findById(session.levelTemplate())
                .map(template -> json.<JsonNode>valueToTree(template.config()))
                .orElseThrow(() -> new BusinessException("La configuración oficial no está disponible para diagnosticar."));
        NeonHintDiagnosis diagnosis = BoardRules.diagnoseNeon(config, session.state());
        if (diagnosis.solved()) throw new BusinessException("La partida ya está resuelta.");
        long used = hints.countConsumed(sessionId);
        if (used >= properties.getMaxHints()) throw new BusinessException("Se agotó el cupo de pistas para este intento.");
        String diagnosisKey = diagnosis.key() + ":" + diagnosis.targetX() + ":" + diagnosis.targetY();
        int hintLevel = Math.min((int) hints.countConsumedForDiagnosis(sessionId, diagnosisKey) + 1, 3);
        String message = message(diagnosis, hintLevel, locale);
        String hintId = UUID.randomUUID().toString();
        var receipt = new GameSessionHintRepositoryPort.HintReceipt(
                hintId, sessionId, command.requestId(), hash, diagnosisKey, command.revision(),
                locale, "RULE_BASED", hintLevel, diagnosis.type(), message,
                diagnosis.targetX(), diagnosis.targetY(), now, null);
        hints.save(receipt);
        return dto(hints.findByRequest(sessionId, command.requestId()).orElse(receipt));
    }

    private GameSession ownedSession(String studentId, String sessionId) {
        sessions.lockStudent(studentId);
        GameSession session = sessions.lockSession(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("La sesión no existe."));
        if (!studentId.equals(session.studentId())) throw new AccessDeniedException("La sesión no pertenece al estudiante.");
        return session;
    }

    private String message(NeonHintDiagnosis diagnosis, int level, String locale) {
        String row = diagnosis.targetY() == null ? "" : String.valueOf(diagnosis.targetY() + 1);
        String column = diagnosis.targetX() == null ? "" : String.valueOf(diagnosis.targetX() + 1);
        return switch (diagnosis.key()) {
            case "FILTER_COLOR_MISMATCH" -> switch (level) {
                case 1 -> "Los filtros dejan pasar el haz únicamente cuando coincide su color.";
                case 2 -> "Observa el filtro donde se detuvo el haz, en la fila " + row + ", columna " + column + ".";
                default -> "¿Coincide el color del haz con el del filtro que lo detuvo?";
            };
            case "BLOCKED_PATH" -> switch (level) {
                case 1 -> "Un obstáculo está interrumpiendo la trayectoria del haz.";
                case 2 -> "Observa el obstáculo ubicado en la fila " + row + ", columna " + column + ".";
                default -> "¿Qué giro permitiría evitar el obstáculo sin perder el receptor?";
            };
            case "CYCLIC_PATH" -> switch (level) {
                case 1 -> "El haz está repitiendo una trayectoria. Revisa el patrón de giros de los espejos.";
                case 2 -> "La trayectoria vuelve a pasar por la fila " + row + ", columna " + column + ".";
                default -> "¿Qué espejo rompe el ciclo sin alejar el haz del receptor?";
            };
            default -> switch (level) {
                case 1 -> "Sigue el haz desde el emisor y comprueba cómo lo afectan los espejos y filtros.";
                case 2 -> "El receptor esperado está cerca de la fila " + row + ", columna " + column + ".";
                default -> "¿Qué parte de la trayectoria todavía no alcanza el receptor?";
            };
        };
    }

    private void validateUuid(String value) {
        try { UUID.fromString(value); }
        catch (IllegalArgumentException | NullPointerException error) { throw new BusinessException("requestId no es un UUID válido."); }
    }

    private String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
    }

    private GameHintDTO dto(GameSessionHintRepositoryPort.HintReceipt receipt) {
        var target = receipt.targetX() == null || receipt.targetY() == null
                ? null : new GameHintDTO.TargetCellDTO(receipt.targetX(), receipt.targetY());
        return new GameHintDTO(receipt.requestId(), receipt.hintId(), receipt.revision(), receipt.source(),
                receipt.hintLevel(), receipt.type(), receipt.message(), target);
    }

    private static final class SetSupport {
        private static java.util.Set<String> asSet(java.util.List<String> values) { return java.util.Set.copyOf(values); }
    }
}
