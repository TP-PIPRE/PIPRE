package com.pipre.backend;

import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/")
public class HomeController {

    private final HealthEndpoint healthEndpoint;

    public HomeController(HealthEndpoint healthEndpoint) {
        this.healthEndpoint = healthEndpoint;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getIndex() {
        HealthComponent health = healthEndpoint.health();

        Map<String, Object> response = new HashMap<>();
        response.put("name", "Pripre Backend");
        response.put("version", "0.0.2");
        response.put("status", health.getStatus().getCode());
        response.put("timestamp", LocalDateTime.now());
        response.put("endpoint_docs", "/swagger-ui/index.html");
        response.put("health_check", "/actuator/health");

        return ResponseEntity.ok().body(response);
    }
}