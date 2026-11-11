package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.commands.RequestGameHintCommand;
import com.pipre.backend.application.dto.GameHintDTO;
import com.pipre.backend.application.ports.input.RequestGameHintUseCase;
import com.pipre.backend.application.ports.output.GameSessionHintRepositoryPort;
import com.pipre.backend.application.ports.output.GameSessionRepositoryPort;
import com.pipre.backend.application.ports.output.NeonFlowTemplateRepositoryPort;
import com.pipre.backend.application.ports.output.TetriLogicTemplateRepositoryPort;
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
import java.util.function.IntFunction;

@Service
@RequiredArgsConstructor
public class RequestGameHintService implements RequestGameHintUseCase {
    private final GameSessionRepositoryPort sessions;
    private final GameSessionHintRepositoryPort hints;
    private final TutorPilotPolicy pilot;
    private final NeonFlowTemplateRepositoryPort neonTemplates;
    private final TetriLogicTemplateRepositoryPort tetriTemplates;
    private final ObjectMapper json;
    private final TutorPilotProperties properties;

    @Override
    @Transactional
    public GameHintDTO execute(String studentId, String sessionId, RequestGameHintCommand command) {
        validateUuid(command.requestId());
        GameSession session = ownedSession(studentId, sessionId);
        if (ProgressiveTutorService.governed(session)) {
            throw new BusinessException("Solicita las ayudas desde el tutor progresivo de esta partida.");
        }
        if (session.dailyChallengeId() != null) {
            throw new BusinessException("Los retos diarios conservan únicamente la ayuda estática.");
        }
        if (pilot.allowedGroups(session).isEmpty()) throw new BusinessException("La actividad o el aula no está habilitada para el tutor contextual.");
        if (!"es".equalsIgnoreCase(command.locale())) throw new BusinessException("El piloto solo admite locale es.");
        String locale = command.locale().toLowerCase(Locale.ROOT);
        String hash = hash(command.requestId() + "|" + command.revision() + "|" + locale);
        var previous = hints.findByRequest(sessionId, command.requestId());
        if (previous.isPresent()) {
            if (!hash.equals(previous.get().requestHash())) throw new BusinessException("La solicitud ya fue utilizada con otros datos.");
            return dto(previous.get());
        }
        if (!"ACTIVE".equals(session.status())) throw new BusinessException("La sesión ya no está activa.");
        if (command.revision() != session.revision()) throw new GameHintStaleException(command.revision(), session.revision());
        Instant now = Instant.now();
        if (hints.countPending(sessionId, command.revision()) > 0) {
            throw new GameHintPendingException();
        }

        long used = hints.countConsumed(sessionId);
        if (used >= properties.getMaxHints()) throw new BusinessException("Se agotó el cupo de pistas para este intento.");
        var diagnosis = diagnose(session);
        int hintLevel = (int) Math.min(hints.countConsumedForDiagnosis(sessionId, diagnosis.key()) + 1, 3);
        var receipt = new GameSessionHintRepositoryPort.HintReceipt(
                UUID.randomUUID().toString(), sessionId, command.requestId(), hash, diagnosis.key(), command.revision(),
                locale, "RULE_BASED", hintLevel, diagnosis.type(), diagnosis.message().apply(hintLevel),
                diagnosis.x(), diagnosis.y(), diagnosis.axis(), diagnosis.line(), now, null);
        hints.save(receipt);
        return dto(hints.findByRequest(sessionId, command.requestId()).orElse(receipt));
    }

    private record Diagnosis(String key, String type, Integer x, Integer y, String axis, Integer line,
                             IntFunction<String> message) {}

    private Diagnosis diagnose(GameSession session) {
        if ("tetrilogic".equals(session.game())) {
            JsonNode config = tetriTemplates.findById(session.levelTemplate())
                    .map(template -> json.<JsonNode>valueToTree(template.config()))
                    .orElseThrow(() -> new BusinessException("La configuración oficial no está disponible para diagnosticar."));
            var line = BoardRules.diagnoseTetri(config, session.state())
                    .orElseThrow(() -> new BusinessException("No hay una diferencia verificable entre los conteos y sus objetivos."));
            String key = "TETRI:" + line.axis() + ":" + line.index() + ":" + line.occupied() + ":" + line.target();
            return new Diagnosis(key, "LINE_HINT", null, null, line.axis(), line.index(), level -> tetriMessage(line, level));
        }
        JsonNode config = neonTemplates.findById(session.levelTemplate())
                .map(template -> json.<JsonNode>valueToTree(template.config()))
                .orElseThrow(() -> new BusinessException("La configuración oficial no está disponible para diagnosticar."));
        var neon = BoardRules.diagnoseNeon(config, session.state());
        if (neon.solved()) throw new BusinessException("La partida ya está resuelta.");
        String key = neon.key() + ":" + neon.targetX() + ":" + neon.targetY();
        return new Diagnosis(key, neon.type(), neon.targetX(), neon.targetY(), null, null, level -> message(neon, level));
    }

    private String tetriMessage(BoardRules.TetriHintDiagnosis diagnosis, int level) {
        if (level == 1) return "Compara las casillas ocupadas con el objetivo de cada fila y columna. Un objetivo cero requiere dejar esa línea vacía.";
        boolean row = "row".equals(diagnosis.axis());
        String line = (row ? "fila " : "columna ") + (diagnosis.index() + 1);
        if (level == 2) {
            String relation = diagnosis.occupied() < diagnosis.target() ? "Le faltan casillas ocupadas." : "Tiene casillas ocupadas de más.";
            return "Revisa la " + line + ": tiene " + diagnosis.occupied() + " casillas ocupadas y su objetivo es " + diagnosis.target() + ". " + relation;
        }
        if (diagnosis.occupied() > diagnosis.target()) {
            return "En la " + line + " sobran casillas ocupadas. ¿Qué pieza podrías mover sin dejar cortas otras líneas?";
        }
        String otherAxis = row ? "columnas" : "filas";
        return "En la " + line + " faltan casillas ocupadas. ¿Cuáles tienen espacio libre y cruzan " + otherAxis + " que aún necesitan casillas?";
    }

    private GameSession ownedSession(String studentId, String sessionId) {
        sessions.lockStudent(studentId);
        GameSession session = sessions.lockSession(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("La sesión no existe."));
        if (!studentId.equals(session.studentId())) throw new AccessDeniedException("La sesión no pertenece al estudiante.");
        return session;
    }

    private String message(NeonHintDiagnosis diagnosis, int level) {
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
        try { if (!UUID.fromString(value).toString().equalsIgnoreCase(value)) throw new IllegalArgumentException(); }
        catch (IllegalArgumentException | NullPointerException error) { throw new BusinessException("requestId no es un UUID válido."); }
    }

    private String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
    }

    private GameHintDTO dto(GameSessionHintRepositoryPort.HintReceipt receipt) {
        var target = receipt.targetX() == null || receipt.targetY() == null
                ? null : new GameHintDTO.TargetCellDTO(receipt.targetX(), receipt.targetY());
        var line = receipt.targetAxis() == null || receipt.targetLine() == null
                ? null : new GameHintDTO.TargetLineDTO(receipt.targetAxis(), receipt.targetLine());
        return new GameHintDTO(receipt.requestId(), receipt.hintId(), receipt.revision(), receipt.source(),
                receipt.hintLevel(), receipt.type(), receipt.message(), target, line);
    }

}
