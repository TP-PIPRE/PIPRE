package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.SaveAttemptCommand;
import com.pipre.backend.application.ports.input.SaveAttemptUseCase;
import com.pipre.backend.application.ports.output.SaveTelemetryPort;
import com.pipre.backend.domain.entities.telemetry.TelemetryAttempt;
import com.pipre.backend.domain.exceptions.BusinessException;
import com.pipre.backend.domain.factories.TelemetryAttemptFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Set;
import java.util.UUID;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class SaveAttemptService implements SaveAttemptUseCase {
    private final SaveTelemetryPort saveTelemetryPort;
    private final ActivityRepositoryPort activities;
    private final UserRepositoryPort users;

    private LocalDateTime parseCompletedAt(String completedAt) {
        if (completedAt == null || completedAt.isBlank()) {
            throw new BusinessException("El formato de completedAt no es válido.");
        }
        try {
            return LocalDateTime.ofInstant(Instant.parse(completedAt), ZoneOffset.UTC);
        } catch (DateTimeParseException e) {
            throw new BusinessException("El formato de completedAt no es válido.");
        }
    }

    @Override
    public void execute(SaveAttemptCommand command) {
        if (users.findById(command.studentId()).isEmpty()) throw new BusinessException("El estudiante no existe.");
        if (!Set.of("neonflow", "tetrilogic").contains(command.game()) || !Set.of("SUCCESS", "FAILED", "ABANDONED").contains(command.result())) throw new BusinessException("Juego o resultado de telemetría no válido.");
        if (command.trace() != null && !command.trace().isNull()) {
            String fingerprint=com.pipre.backend.application.commands.TelemetryFingerprint.of(command);
            String id = UUID.nameUUIDFromBytes((command.studentId() + ":" + command.trace().path("clientAttemptId").asText()).getBytes(StandardCharsets.UTF_8)).toString();
            var existing=saveTelemetryPort.findById(id);
            if(existing.isPresent()) {
                if(existing.get().getTrace()!=null&&fingerprint.equals(existing.get().getTrace().path("clientRequestHash").asText()))return;
                throw new BusinessException("El identificador del intento ya contiene otra traza.");
            }
            ObjectNode trace = validateTrace(command);
            trace.put("clientRequestHash",fingerprint);
            saveTelemetryPort.save(TelemetryAttempt.builder().idAttempt(id).studentId(command.studentId()).game(command.game()).result(command.result())
                .tiempoResolucion(command.tiempoResolucion()).movimientos(command.movimientos()).reinicios(command.reinicios()).pistasIa(command.pistasIa())
                .completedAt(parseCompletedAt(command.completedAt())).trace(trace).build());
            return;
        }
        TelemetryAttempt attempt = TelemetryAttemptFactory.createNewAttempt(
                command.studentId(),
                command.game(),
                command.result(),
                command.tiempoResolucion(),
                command.movimientos(),
                command.reinicios(),
                command.pistasIa(),
                parseCompletedAt(command.completedAt())
        );
        saveTelemetryPort.save(attempt);
    }

    private ObjectNode validateTrace(SaveAttemptCommand command) {
        JsonNode input = command.trace();
        if (!input.isObject() || input.toString().length() > 1000000) throw new BusinessException("La traza no es válida o supera su tamaño permitido.");
        ObjectNode trace = (ObjectNode) input.deepCopy();
        try { UUID.fromString(trace.path("clientAttemptId").asText()); } catch (IllegalArgumentException e) { throw new BusinessException("El identificador del intento no es válido."); }
        String template = trace.path("levelTemplate").asText();
        try { Activity.builder().idActivity("validation").idLesson("validation").name("validation").environment(command.game()).levelTemplate(template).build(); }
        catch (IllegalArgumentException e) { throw new BusinessException("La plantilla no corresponde al juego."); }
        int version = template.contains("-v2-") || (template.startsWith("neonflow-") && !Set.of("neonflow-1", "neonflow-2").contains(template)) ? 2 : 1;
        if (!trace.path("templateVersion").isIntegralNumber() || trace.path("templateVersion").asInt(-1) != version) throw new BusinessException("La versión de la plantilla no es válida.");
        String ruleset = command.game().equals("neonflow") ? "neonflow-raycast-v1" : "tetrilogic-counts-v1";
        if (!ruleset.equals(trace.path("ruleset").asText())) throw new BusinessException("La versión de reglas no es válida.");
        var started = parseCompletedAt(trace.path("startedAt").asText());
        var completed = parseCompletedAt(command.completedAt());
        if (started.isAfter(completed)) throw new BusinessException("El inicio no puede ser posterior al final.");
        long duration=java.time.Duration.between(started,completed).toMillis();
        if (trace.hasNonNull("activityId")) {
            var activity = activities.findById(trace.path("activityId").asText()).orElseThrow(() -> new BusinessException("La actividad no existe."));
            if (!command.game().equals(activity.getEnvironment()) || !template.equals(activity.getLevelTemplate())) throw new BusinessException("La actividad no corresponde a la plantilla del intento.");
            trace.put("difficulty", activity.getDifficulty());
        } else trace.putNull("difficulty");
        JsonNode events = trace.path("events");
        if (!events.isArray() || events.isEmpty() || events.size() > 5000) throw new BusinessException("La secuencia de eventos no es válida.");
        long previous = -1;
        Set<String> types = Set.of("SELECT", "PLACE", "ROTATE", "RETURN", "RESET", "CHECK", "HELP", "REJECT", "CANCEL", "COMPLETE", "ABANDON");
        Set<String> keys = Set.of("pieceId", "pieceType", "x", "y", "rotation", "component", "color", "errorCode", "source", "matched");
        for (int i=0; i<events.size(); i++) {
            JsonNode event = events.get(i);
            long elapsed = event.path("elapsedMs").asLong(-1);
            if (!event.path("sequence").isIntegralNumber() || !event.path("elapsedMs").isIntegralNumber() || event.path("sequence").asInt(-1) != i+1 || elapsed < 0 || elapsed < previous || elapsed > Math.min(604800000,duration+1000) || !types.contains(event.path("type").asText())) throw new BusinessException("El orden o tipo de evento no es válido.");
            previous = elapsed;
            var eventFields=event.fieldNames();while(eventFields.hasNext())if(!Set.of("sequence","elapsedMs","type","data").contains(eventFields.next()))throw new BusinessException("Campo de evento no admitido.");
            JsonNode data = event.path("data");
            if (!data.isObject()) throw new BusinessException("Los datos de evento no son válidos.");
            var names = data.fieldNames();
            while(names.hasNext()) {
                String key = names.next(); JsonNode value = data.get(key);
                if (!keys.contains(key) || !value.isValueNode() || value.isNull() || (value.isTextual() && value.asText().length()>80)) throw new BusinessException("Los datos de evento contienen campos no admitidos.");
                if (Set.of("x","y").contains(key) && (!value.isIntegralNumber() || value.asInt() < -1 || value.asInt()>32)) throw new BusinessException("Coordenada no válida.");
                if (key.equals("rotation") && (!value.isIntegralNumber() || !Set.of(0,90,180,270).contains(value.asInt()))) throw new BusinessException("Giro no válido.");
                if (key.equals("matched")&&!value.isBoolean())throw new BusinessException("Estado de comprobación no válido.");
                if (Set.of("pieceId","pieceType","component","color","errorCode","source").contains(key) && (!value.isTextual()||!value.asText().matches("[A-Za-z0-9_-]{1,40}")))throw new BusinessException("Identificador de evento no válido.");
            }
        }
        for (String name : Set.of("initialState", "finalState")) {
            JsonNode state = trace.path(name);
            if (!state.isArray() || state.size()>64 || state.toString().length()>20000) throw new BusinessException("Estado de tablero no válido.");
            for (JsonNode piece : state) {
                if (!piece.isObject()) throw new BusinessException("Estado de pieza no válido.");
                var names=piece.fieldNames();
                while(names.hasNext()) { String key=names.next(); JsonNode value=piece.get(key); if(!Set.of("id","type","x","y","rotation","color").contains(key) || !value.isValueNode() || value.isNull() || value.toString().length()>82) throw new BusinessException("Campo de estado no admitido.");
                    if(Set.of("id","type","color").contains(key)&&(!value.isTextual()||!value.asText().matches("[A-Za-z0-9_-]{1,40}")))throw new BusinessException("Identificador de estado no válido.");
                    if(Set.of("x","y").contains(key)&&(!value.isIntegralNumber()||value.asInt() < -1||value.asInt()>32))throw new BusinessException("Coordenada de estado no válida.");
                    if(key.equals("rotation")&&(!value.isIntegralNumber()||!Set.of(0,90,180,270).contains(value.asInt())))throw new BusinessException("Giro de estado no válido.");
                }
            }
        }
        Set<String> fields=Set.of("clientAttemptId","activityId","levelTemplate","templateVersion","ruleset","startedAt","events","initialState","finalState","droppedEvents","difficulty");
        var names=trace.fieldNames(); while(names.hasNext()) if(!fields.contains(names.next())) throw new BusinessException("Campo de traza no admitido.");
        if (!trace.path("droppedEvents").isIntegralNumber() || trace.path("droppedEvents").asInt()<0) throw new BusinessException("Contador de eventos omitidos no válido.");
        trace.put("clientReported", true);
        return trace;
    }
}
