package com.pipre.backend.infrastructure.configuration;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import java.net.URI;
import java.time.Duration;

@Getter
@Setter
@Component
@Validated
@ConfigurationProperties(prefix = "pipre.tutor.progressive")
public class ProgressiveTutorProperties {
    private boolean enabled;
    @NotNull
    private URI baseUrl = URI.create("http://localhost:11434");
    @NotBlank
    private String model = "qwen3:4b";
    @NotNull
    private Duration timeout = Duration.ofSeconds(15);

    @AssertTrue(message = "La URL de Ollama debe ser una dirección HTTP(S) base sin credenciales ni parámetros.")
    public boolean isValidBaseUrl() {
        return baseUrl != null && baseUrl.getHost() != null
                && ("http".equalsIgnoreCase(baseUrl.getScheme()) || "https".equalsIgnoreCase(baseUrl.getScheme()))
                && (baseUrl.getPath().isEmpty() || "/".equals(baseUrl.getPath()))
                && baseUrl.getUserInfo() == null && baseUrl.getQuery() == null && baseUrl.getFragment() == null;
    }

    @AssertTrue(message = "El tiempo de espera de Ollama debe estar entre 1 y 19 segundos.")
    public boolean isValidTimeout() {
        return timeout != null && timeout.compareTo(Duration.ofSeconds(1)) >= 0
                && timeout.compareTo(Duration.ofSeconds(19)) <= 0;
    }
}
