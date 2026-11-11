package com.pipre.backend.adapters.out.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipre.backend.application.ports.output.ProgressiveHintGeneratorPort.Context;
import com.pipre.backend.domain.exceptions.ProgressiveHintUnavailableException;
import com.pipre.backend.infrastructure.configuration.ProgressiveTutorProperties;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OllamaProgressiveHintAdapterTest {
    private final ObjectMapper json = new ObjectMapper();
    private final ProgressiveTutorProperties properties = new ProgressiveTutorProperties();
    private final AtomicReference<String> requestBody = new AtomicReference<>();
    private final Context context = new Context("El haz rojo se detuvo al entrar en un filtro azul.",
            List.of("Se añadió un filtro azul."), List.of("Recuerda que el color del haz depende del emisor."), 2, "neonflow");
    private HttpServer server;
    private OllamaProgressiveHintAdapter adapter;

    @AfterEach
    void stopServer() {
        if (adapter != null) adapter.closeClient();
        if (server != null) server.stop(0);
    }

    @Test
    void sendsOnlyBoardFactsAndParsesStructuredAdvice() throws IOException {
        String advice = "Recuerda que un filtro solo deja pasar la luz de su color.";
        OllamaProgressiveHintAdapter adapter = ollamaResponse(200, envelope(json.writeValueAsString(Map.of("message", advice))));

        assertThat(adapter.generate(context)).isEqualTo(advice);

        var request = json.readTree(requestBody.get());
        assertThat(request.path("model").asText()).isEqualTo("qwen3:4b");
        assertThat(request.path("stream").asBoolean()).isFalse();
        assertThat(request.path("think").asBoolean()).isFalse();
        assertThat(request.path("format").path("required").get(0).asText()).isEqualTo("message");
        assertThat(request.has("tools")).isFalse();
        var facts = json.readTree(request.path("messages").get(1).path("content").asText());
        assertThat(facts).isEqualTo(json.valueToTree(Map.of("diagnosis", context.diagnosis(), "recentActions", context.recentActions())));
    }

    @Test
    void guidesTetriLogicAdviceWithTheOccupancyGoalForEachLine() throws IOException {
        var tetri = new Context("En la fila uno hay una casilla ocupada y el objetivo es tres.",
                List.of("Intentó colocar una pieza"), List.of(), 2, "tetrilogic");
        String advice = "Recuerda que cada fila tiene su propio objetivo de casillas ocupadas.";
        var adapter = ollamaResponse(200, envelope(json.writeValueAsString(Map.of("message", advice))));

        assertThat(adapter.generate(tetri)).isEqualTo(advice);

        var prompt = json.readTree(requestBody.get()).path("messages").get(0).path("content").asText();
        assertThat(prompt).contains("TetriLogic", "El objetivo del diagnóstico pertenece únicamente a la línea indicada",
                "cada fila o columna tiene su propio objetivo de casillas ocupadas");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "texto libre", "{\"message\":\"\"}",
            "{\"message\":\"Gira el espejo 90 grados.\"}", "{\"message\":\"Mira <b>el espejo</b>.\"}",
            "{\"message\":\"Recuerda que quitar el filtro verde dejaría libre el recorrido.\"}",
            "{\"message\":\"Recuerda que la luz solo pasa por un filtro de la.\"}",
            "{\"message\":\"Mira el espejo.\"}{\"message\":\"Otro consejo.\"}"})
    void rejectsInvalidAdvice(String content) throws IOException {
        var adapter = ollamaResponse(200, envelope(content));
        assertThatThrownBy(() -> adapter.generate(context)).isInstanceOf(ProgressiveHintUnavailableException.class);
    }

    @Test
    void exposesProviderFailureAsUnavailable() throws IOException {
        var adapter = ollamaResponse(503, "{\"error\":\"internal details\"}");
        assertThatThrownBy(() -> adapter.generate(context)).isInstanceOf(ProgressiveHintUnavailableException.class)
                .hasMessageNotContaining("internal details");
    }

    @Test
    void requestsAnAlternativeWhenTheProviderRepeatsAnEarlierAdvice() throws IOException {
        String alternate = "Recuerda que un filtro solo deja pasar la luz de su color.";
        var adapter = ollamaResponse(200, envelope("{\"message\":\"Recuerda que del emisor depende el color del haz.\"}"),
                envelope(json.writeValueAsString(Map.of("message", alternate))));

        assertThat(adapter.generate(context)).isEqualTo(alternate);
        assertThat(requestBody.get()).contains("Redacta una alternativa");
    }

    @Test
    void doesNotCallOllamaWhenTheFeatureIsDisabled() throws IOException {
        var adapter = ollamaResponse(200, envelope("{}"));
        properties.setEnabled(false);
        assertThatThrownBy(() -> adapter.generate(context)).isInstanceOf(ProgressiveHintUnavailableException.class);
        assertThat(requestBody.get()).isNull();
    }

    private String envelope(String content) throws IOException {
        return json.writeValueAsString(Map.of("done", true, "message", Map.of("content", content)));
    }

    private OllamaProgressiveHintAdapter ollamaResponse(int status, String... bodies) throws IOException {
        var requests = new AtomicInteger();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/chat", exchange -> {
            try (exchange) {
                requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                byte[] response = bodies[Math.min(requests.getAndIncrement(), bodies.length - 1)].getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(status, response.length);
                exchange.getResponseBody().write(response);
            }
        });
        server.start();
        properties.setEnabled(true);
        properties.setBaseUrl(URI.create("http://127.0.0.1:" + server.getAddress().getPort()));
        adapter = new OllamaProgressiveHintAdapter(properties, json);
        return adapter;
    }
}
