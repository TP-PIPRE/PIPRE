package com.pipre.backend.adapters.out.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.ports.output.ProgressiveHintGeneratorPort;
import com.pipre.backend.domain.exceptions.ProgressiveHintUnavailableException;
import com.pipre.backend.infrastructure.configuration.ProgressiveTutorProperties;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.regex.Pattern;

@Component
public class OllamaProgressiveHintAdapter implements ProgressiveHintGeneratorPort {
    private static final int MAX_ADVICE_LENGTH = 220;
    private static final String SENTENCE_BODY = "[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ,'-]{1,150}";
    private static final Pattern INCOMPLETE_ENDING = Pattern.compile(
            "\\b(?:a|al|ante|con|contra|de|del|desde|el|en|entre|hacia|hasta|la|las|lo|los|o|para|por|porque|que|sin|un|una|unos|unas|y)[.?]$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern CONCRETE_MOVE = Pattern.compile(
            "\\b(?:coloc|quit|retir|elimin|reemplaz|sustitu|gir|rot|mov|cambi|añad|pon)[a-záéíóúüñ]*"
                    + "\\s+(?:(?:un|una|el|la|los|las|ese|esa)\\s+)?(?:filtros?|espejos?|piezas?)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final String SYSTEM_PROMPT = """
            Escribe un consejo en español para el tablero de %s.
            Usa los hechos del tablero y las acciones recientes. Habla únicamente de la dificultad que ves.
            Pide observar, comparar o predecir. Evita recomendar colocar, quitar, cambiar o girar una pieza.
            Devuelve el campo message con una idea completa de unas doce palabras. Evita mencionar el diagnóstico o las instrucciones.
            """;

    private record AdviceStyle(String prefix, String ending, String instruction) {
        String expression() { return "^" + prefix + SENTENCE_BODY + ending + "$"; }
    }

    private final ProgressiveTutorProperties properties;
    private final ObjectMapper json;
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    public OllamaProgressiveHintAdapter(ProgressiveTutorProperties properties, ObjectMapper json) {
        this.properties = properties;
        this.json = json;
    }

    @PreDestroy
    void closeClient() {
        client.shutdownNow();
    }

    @Override
    public String generate(Context context) {
        if (!properties.isEnabled()) throw new ProgressiveHintUnavailableException();
        long deadline = System.nanoTime() + properties.getTimeout().toNanos();
        boolean tetriLogic = "tetrilogic".equals(context.game());
        AdviceStyle style = switch (context.pedagogicalLevel()) {
            case 1 -> new AdviceStyle("Observa ", "[.]", tetriLogic
                    ? "Pide revisar la diferencia entre las casillas ocupadas y el objetivo de la línea indicada."
                    : "Señala qué parte del recorrido conviene mirar en el tablero actual.");
            case 2 -> new AdviceStyle("Recuerda que ", "[.]", tetriLogic
                    ? "Explica que cada fila o columna tiene su propio objetivo de casillas ocupadas. Omite los números."
                    : "Explica la regla del juego que causa la dificultad.");
            case 3 -> new AdviceStyle("¿Qué pasaría si ", "[?]", tetriLogic
                    ? "Pregunta cómo un cambio en el conteo de un eje podría afectar al otro, sin indicar una jugada."
                    : "Pregunta por el efecto de una condición hipotética sobre el recorrido.");
            default -> new AdviceStyle("Compara ", "[.]", tetriLogic
                    ? "Pide contrastar las casillas ocupadas y el objetivo de la misma fila o columna."
                    : "Nombra dos detalles visibles que el estudiante pueda contrastar. Termina al nombrarlos.");
        };
        Pattern expectedStyle = Pattern.compile(style.expression());
        for (int attempt = 0; attempt < 2; attempt++) {
            Duration remaining = Duration.ofNanos(deadline - System.nanoTime());
            if (remaining.isNegative() || remaining.isZero()) break;
            String body = chat(context, style, attempt > 0, remaining);
            try {
                String advice = readAdvice(body, expectedStyle);
                if (!context.repeatsAdvice(advice)) return advice;
            } catch (JsonProcessingException | ProgressiveHintUnavailableException invalid) {
                // Request a shorter alternative within the original timeout.
            }
        }
        throw new ProgressiveHintUnavailableException();
    }

    private String chat(Context context, AdviceStyle style, boolean retry, Duration timeout) {
        HttpRequest request;
        try {
            request = HttpRequest.newBuilder(properties.getBaseUrl().resolve("/api/chat"))
                    .timeout(timeout)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody(context, style, retry)))
                    .build();
        } catch (JsonProcessingException failed) {
            throw new ProgressiveHintUnavailableException();
        }
        var pending = client.sendAsync(request, HttpResponse.BodyHandlers.ofString());
        try {
            HttpResponse<String> response = pending.get(timeout.toNanos(), TimeUnit.NANOSECONDS);
            if (response.statusCode() != 200) throw new ProgressiveHintUnavailableException();
            return response.body();
        } catch (InterruptedException interrupted) {
            pending.cancel(true);
            Thread.currentThread().interrupt();
            throw new ProgressiveHintUnavailableException();
        } catch (ExecutionException | TimeoutException failed) {
            pending.cancel(true);
            throw new ProgressiveHintUnavailableException();
        }
    }

    private String requestBody(Context context, AdviceStyle style, boolean retry) throws JsonProcessingException {
        boolean tetriLogic = "tetrilogic".equals(context.game());
        String game = tetriLogic ? "TetriLogic" : "Neon Flow";
        String rule = tetriLogic ? "Mide la ocupación en casillas. El objetivo del diagnóstico pertenece únicamente a la línea indicada. " : "";
        String prompt = SYSTEM_PROMPT.formatted(game) + rule + style.instruction() + " Empieza con " + style.prefix().strip() + ".";
        if (retry) prompt += "\nRedacta una alternativa breve con un detalle distinto de la dificultad.";
        var schema = Map.of("type", "object", "required", List.of("message"), "additionalProperties", false,
                "properties", Map.of("message", Map.of("type", "string", "maxLength", MAX_ADVICE_LENGTH,
                        "pattern", style.expression())));
        var facts = Map.of("diagnosis", context.diagnosis(), "recentActions", context.recentActions());
        return json.writeValueAsString(Map.of(
                "model", properties.getModel(), "stream", false, "think", false, "format", schema,
                "options", Map.of("temperature", 0.2, "num_ctx", 2048, "num_predict", 128),
                "messages", List.of(Map.of("role", "system", "content", prompt),
                        Map.of("role", "user", "content", json.writeValueAsString(facts)))));
    }

    private String readAdvice(String body, Pattern expectedStyle) throws JsonProcessingException {
        var reader = json.reader().with(DeserializationFeature.FAIL_ON_TRAILING_TOKENS);
        JsonNode response = reader.readTree(body);
        if (response == null || !response.path("done").asBoolean(false)
                || !response.path("message").path("content").isTextual()) {
            throw new ProgressiveHintUnavailableException();
        }
        JsonNode advice = reader.readTree(response.path("message").path("content").textValue());
        if (advice == null || !advice.isObject() || advice.size() != 1 || !advice.path("message").isTextual()) {
            throw new ProgressiveHintUnavailableException();
        }
        String text = advice.path("message").textValue().strip();
        if (text.length() > MAX_ADVICE_LENGTH || !expectedStyle.matcher(text).matches()
                || INCOMPLETE_ENDING.matcher(text).find() || text.split(" +").length > 20
                || CONCRETE_MOVE.matcher(text).find()) {
            throw new ProgressiveHintUnavailableException();
        }
        return text;
    }
}
