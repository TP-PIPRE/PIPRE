package com.pipre.backend.infrastructure.configuration;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "pipre.security")
@Getter
@Setter
public class BrowserSecurityProperties {
    private boolean cookieSecure = false;
    private String cookieSameSite = "Lax";
    private List<String> allowedOrigins = List.of("http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173");

    @PostConstruct
    public void validate() {
        if (!List.of("lax", "strict", "none").contains(cookieSameSite.toLowerCase(java.util.Locale.ROOT))) {
            throw new IllegalArgumentException("cookie-same-site debe ser Lax, Strict o None");
        }
        if ("none".equalsIgnoreCase(cookieSameSite) && !cookieSecure) {
            throw new IllegalArgumentException("SameSite=None requiere cookie-secure=true y HTTPS");
        }
        if (allowedOrigins.isEmpty()) throw new IllegalArgumentException("Configura al menos un origen permitido");
        for (String origin : allowedOrigins) {
            URI uri = URI.create(origin);
            if (uri.getHost() == null || !List.of("http", "https").contains(uri.getScheme())
                    || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null
                    || (uri.getPath() != null && !uri.getPath().isEmpty())) {
                throw new IllegalArgumentException("Cada origen debe ser una URL exacta, sin ruta ni comodines");
            }
        }
    }

    public ResponseCookie cookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from("jwt", token).httpOnly(true).secure(cookieSecure)
                .path("/").maxAge(maxAgeSeconds).sameSite(cookieSameSite).build();
    }
}
