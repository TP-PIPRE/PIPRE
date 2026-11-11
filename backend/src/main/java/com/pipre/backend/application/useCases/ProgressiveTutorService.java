package com.pipre.backend.application.useCases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.commands.RequestProgressiveHintCommand;
import com.pipre.backend.application.dto.ProgressiveHintDTO;
import com.pipre.backend.application.ports.output.AcademicAccessRepositoryPort;
import com.pipre.backend.application.ports.output.GameSessionRepositoryPort;
import com.pipre.backend.application.ports.output.ProgressiveHintGeneratorPort;
import com.pipre.backend.application.ports.output.NeonFlowTemplateRepositoryPort;
import com.pipre.backend.application.ports.output.TetriLogicTemplateRepositoryPort;
import com.pipre.backend.application.ports.output.ProgressiveTutorRepositoryPort;
import com.pipre.backend.application.ports.output.ProgressiveTutorRepositoryPort.Request;
import com.pipre.backend.domain.entities.game.BoardRules;
import com.pipre.backend.domain.entities.game.GameSession;
import com.pipre.backend.domain.exceptions.BusinessException;
import com.pipre.backend.domain.exceptions.GameHintPendingException;
import com.pipre.backend.domain.exceptions.GameHintStaleException;
import com.pipre.backend.domain.exceptions.HintConfirmationRequiredException;
import com.pipre.backend.domain.exceptions.ProgressiveHintUnavailableException;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import com.pipre.backend.infrastructure.configuration.ProgressiveTutorProperties;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.stream.StreamSupport;

@Service
public class ProgressiveTutorService {
    private static final int FIXED_ADVICE = 5;
    private static final int FREE_ADVICE = 8;
    private final GameSessionRepositoryPort sessions;
    private final ProgressiveTutorRepositoryPort requests;
    private final NeonFlowTemplateRepositoryPort templates;
    private final TetriLogicTemplateRepositoryPort tetriTemplates;
    private final AcademicAccessRepositoryPort academicAccess;
    private final ProgressiveHintGeneratorPort generator;
    private final ProgressiveTutorProperties properties;
    private final ObjectMapper json;
    private final Clock clock;
    private final TransactionTemplate transaction;
    private final JsonNode fixedAdvice;

    public ProgressiveTutorService(GameSessionRepositoryPort sessions, ProgressiveTutorRepositoryPort requests,
            NeonFlowTemplateRepositoryPort templates, TetriLogicTemplateRepositoryPort tetriTemplates,
            AcademicAccessRepositoryPort academicAccess,
            ProgressiveHintGeneratorPort generator, ProgressiveTutorProperties properties, ObjectMapper json,
            Clock clock, PlatformTransactionManager manager) throws IOException {
        this.sessions = sessions;
        this.requests = requests;
        this.templates = templates;
        this.tetriTemplates = tetriTemplates;
        this.academicAccess = academicAccess;
        this.generator = generator;
        this.properties = properties;
        this.json = json;
        this.clock = clock;
        this.transaction = new TransactionTemplate(manager);
        try (var stream = new ClassPathResource("catalog/neonflow-progressive-advice.json").getInputStream()) {
            this.fixedAdvice = json.readTree(stream);
        }
    }

    boolean applies(String game, int level, String activity, String dailyChallenge) {
        if (!properties.isEnabled() || dailyChallenge != null || activity == null) return false;
        return switch (game) {
            case "neonflow" -> ((level <= 2 ? "act-c001-v2-" : "act-c001-") + level).equals(activity)
                    && "c001".equals(academicAccess.activityCourse(activity));
            case "tetrilogic" -> ("act-c002-" + level).equals(activity) && "c002".equals(academicAccess.activityCourse(activity));
            default -> false;
        };
    }

    static boolean governed(GameSession session) {
        return switch (session.game()) {
            case "neonflow" -> session.state().path("neonFlowProgressiveTutor").asBoolean();
            case "tetrilogic" -> session.state().path("progressiveTutor").asBoolean();
            default -> false;
        };
    }

    void requireIdle(GameSession session) {
        if (governed(session) && generating(session, clock.instant())) throw new GameHintPendingException();
    }

    int penalizedHelps(GameSession session) {
        return Math.toIntExact(requests.penaltyCount(session.sessionId()));
    }

    long pausedMillis(GameSession session, Instant completedAt) {
        return requests.pausedMillis(session.sessionId(), completedAt);
    }

    public ProgressiveHintDTO.Status status(String studentId, String sessionId) {
        return transaction.execute(tx -> {
            GameSession session = owned(studentId, sessionId);
            var last = requests.lastDelivered(studentId, session.levelTemplate()).map(this::dto).orElse(null);
            return new ProgressiveHintDTO.Status(last == null ? 0 : last.ordinal(), last, generating(session, clock.instant()));
        });
    }

    public ProgressiveHintDTO request(String studentId, String sessionId, RequestProgressiveHintCommand command) {
        var plan = transaction.execute(tx -> prepare(owned(studentId, sessionId), command));
        if (plan.context() == null) return dto(plan.request());
        String message;
        try {
            message = generator.generate(plan.context());
            if (message == null || message.isBlank() || plan.context().repeatsAdvice(message)) {
                throw new ProgressiveHintUnavailableException();
            }
        } catch (ProgressiveHintUnavailableException failure) {
            finish(plan.request(), null);
            throw failure;
        }
        return finish(plan.request(), message);
    }

    private record Plan(Request request, ProgressiveHintGeneratorPort.Context context) {}

    private Plan prepare(GameSession session, RequestProgressiveHintCommand command) {
        String studentId = session.studentId(), template = session.levelTemplate();
        String requestId = command.requestId().toLowerCase(Locale.ROOT);
        Instant now = clock.instant();
        var existing = requests.find(session.sessionId(), requestId).orElse(null);
        if (existing != null) {
            if (existing.ordinal() != command.ordinal() || existing.revision() != command.revision()
                    || existing.acceptedPenalty() != command.acceptPenalty()) {
                throw new BusinessException("El identificador de ayuda ya corresponde a otra solicitud.");
            }
            if ("DELIVERED".equals(existing.status())) return new Plan(existing, null);
            if ("PENDING".equals(existing.status()) && now.isBefore(existing.expiresAt())) throw new GameHintPendingException();
            throw new ProgressiveHintUnavailableException();
        }
        if (!"ACTIVE".equals(session.status()) || command.revision() != session.revision()) {
            throw new GameHintStaleException(command.revision(), session.revision());
        }
        int ordinal = 1 + requests.lastDelivered(studentId, template).map(Request::ordinal).orElse(0);
        if (ordinal != command.ordinal()) throw new GameHintStaleException(command.revision(), session.revision());
        if (ordinal > FREE_ADVICE && !command.acceptPenalty()) throw new HintConfirmationRequiredException();
        if (ordinal <= FREE_ADVICE && command.acceptPenalty()) throw new GameHintStaleException(command.revision(), session.revision());
        var pending = requests.pending(studentId, template).orElse(null);
        if (pending != null) {
            if (pending.sessionId().equals(session.sessionId()) && now.isBefore(pending.expiresAt())) {
                throw new GameHintPendingException();
            }
            requests.finish(pending.sessionId(), pending.requestId(), null, now);
        }
        if (ordinal <= FIXED_ADVICE) {
            String message = "tetrilogic".equals(session.game())
                    ? TetriLogicTutorAdvice.fixed(tetriConfig(template), ordinal)
                    : template.startsWith("neonflow-v3-") ? progressiveNeonAdvice(neonConfig(template), ordinal)
                    : fixedAdvice.path(template).path(ordinal - 1).asText();
            if (message.isBlank()) throw new ProgressiveHintUnavailableException();
            var receipt = new Request(session.sessionId(), requestId, studentId, template, ordinal, session.revision(),
                    command.acceptPenalty(), "STATIC", now, now, "DELIVERED", message);
            requests.save(receipt);
            return new Plan(receipt, null);
        }
        var context = context(session, ordinal);
        Instant startedAt = clock.instant();
        var receipt = new Request(session.sessionId(), requestId, studentId, template, ordinal, session.revision(),
                command.acceptPenalty(), "GENERATIVE", startedAt, startedAt.plus(properties.getTimeout()).plusSeconds(5), "PENDING", null);
        requests.save(receipt);
        return new Plan(receipt, context);
    }

    private ProgressiveHintGeneratorPort.Context context(GameSession session, int ordinal) {
        boolean tetriLogic = "tetrilogic".equals(session.game());
        String facts = tetriLogic
                ? TetriLogicTutorAdvice.diagnosis(tetriConfig(session.levelTemplate()), session.state())
                : neonDiagnosis(session);
        var actions = sessions.recentActions(session.sessionId()).stream()
                .map(action -> tetriLogic ? TetriLogicTutorAdvice.actionSummary(action) : neonActionSummary(action)).toList();
        return new ProgressiveHintGeneratorPort.Context(facts, actions,
                requests.recentMessages(session.studentId(), session.levelTemplate()), Math.min(4, ordinal - FIXED_ADVICE),
                session.game());
    }

    private JsonNode tetriConfig(String templateId) {
        return tetriTemplates.findById(templateId).map(template -> json.<JsonNode>valueToTree(template.config()))
                .orElseThrow(ProgressiveHintUnavailableException::new);
    }

    private JsonNode neonConfig(String templateId) {
        return templates.findById(templateId).map(template -> json.<JsonNode>valueToTree(template.config()))
                .orElseThrow(ProgressiveHintUnavailableException::new);
    }

    private String progressiveNeonAdvice(JsonNode config, int ordinal) {
        JsonNode emitter = config.path("emitter");
        JsonNode receptor = config.path("receptors").get(0).path("position");
        return switch (ordinal) {
            case 1 -> "Sigue la flecha del emisor en la fila " + (emitter.path("position").path("y").asInt() + 1)
                    + " e identifica dónde termina el primer tramo recto.";
            case 2 -> "Observa el receptor " + color(emitter.path("color")) + " en la fila " + (receptor.path("y").asInt() + 1)
                    + " y la columna " + (receptor.path("x").asInt() + 1) + ". Piensa desde qué lados puede entrar el haz.";
            case 3 -> "Busca espacios libres antes de cada obstáculo e imagina hacia dónde saldría el haz al girar allí.";
            case 4 -> "Comprueba un tramo a la vez. Si el haz sale del tablero, vuelve al último giro que funcionó.";
            case 5 -> "Traza mentalmente el último tramo desde el receptor hacia atrás y busca cómo conectarlo con el recorrido del emisor.";
            default -> throw new IllegalArgumentException("Ordinal fuera del catálogo de ayudas fijas");
        };
    }

    private String neonDiagnosis(GameSession session) {
        JsonNode config = neonConfig(session.levelTemplate());
        var diagnosis = BoardRules.diagnoseNeon(config, session.state());
        String problem = switch (diagnosis.key()) {
            case "SOLVED" -> "La trayectoria actual ilumina el receptor con el color esperado";
            case "FILTER_COLOR_MISMATCH" -> {
                String filter = StreamSupport.stream(session.state().path("pieces").spliterator(), false)
                        .filter(piece -> diagnosis.targetX() != null && diagnosis.targetY() != null
                                && piece.path("x").asInt(-1) == diagnosis.targetX()
                                && piece.path("y").asInt(-1) == diagnosis.targetY())
                        .findFirst().map(piece -> color(piece.path("color"))).orElse("de otro color");
                yield "Un filtro " + filter + " detiene el haz. Un filtro solo deja pasar un haz de su mismo color";
            }
            case "BLOCKED_PATH" -> "Un obstáculo interrumpe la trayectoria. El haz se detiene al encontrar un obstáculo";
            case "CYCLIC_PATH" -> "El haz vuelve a pasar por el mismo tramo. Una trayectoria en bucle vuelve a pasar por el mismo punto en la misma dirección";
            default -> "La trayectoria todavía no ilumina el receptor. El receptor necesita que el haz llegue con el color esperado";
        };
        return "El haz del emisor es " + color(config.path("emitter").path("color")) + ". " + problem + ".";
    }

    private String neonActionSummary(JsonNode action) {
        return switch (action.path("type").asText()) {
            case "PLACE" -> "FILTER".equals(action.path("component").asText())
                    ? "Intentó colocar un filtro " + color(action.path("color")) : "Intentó colocar un espejo";
            case "ROTATE" -> "Intentó girar un espejo";
            case "CHECK" -> "Comprobó la trayectoria";
            case "RESET" -> "Reinició el tablero";
            default -> "Intentó cambiar el tablero";
        };
    }

    private String color(JsonNode value) {
        return switch (value.asText()) {
            case "red" -> "rojo";
            case "green" -> "verde";
            case "blue" -> "azul";
            default -> "de color neutro";
        };
    }

    private ProgressiveHintDTO finish(Request receipt, String message) {
        Instant finishedAt = clock.instant();
        var delivery = transaction.execute(tx -> {
            GameSession session = owned(receipt.studentId(), receipt.sessionId());
            var current = requests.find(receipt.sessionId(), receipt.requestId()).orElseThrow();
            if (!"PENDING".equals(current.status())) return null;
            boolean valid = "ACTIVE".equals(session.status()) && session.revision() == receipt.revision()
                    && finishedAt.isBefore(receipt.expiresAt());
            requests.finish(receipt.sessionId(), receipt.requestId(), valid ? message : null, finishedAt);
            return valid && message != null ? new ProgressiveHintDTO(receipt.requestId(), receipt.ordinal(), message, receipt.source()) : null;
        });
        if (message != null && delivery == null) throw new GameHintStaleException(receipt.revision(), receipt.revision());
        return delivery;
    }

    private GameSession owned(String studentId, String sessionId) {
        sessions.lockStudent(studentId);
        GameSession session = sessions.lockSession(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("La sesión no existe."));
        if (!session.studentId().equals(studentId) || !governed(session)) {
            throw new AccessDeniedException("Esta partida no tiene acceso al tutor progresivo.");
        }
        return session;
    }

    private boolean generating(GameSession session, Instant now) {
        return requests.pending(session.studentId(), session.levelTemplate()).filter(request ->
                request.sessionId().equals(session.sessionId()) && now.isBefore(request.expiresAt())).isPresent();
    }

    private ProgressiveHintDTO dto(Request request) {
        return new ProgressiveHintDTO(request.requestId(), request.ordinal(), request.message(), request.source());
    }

}
