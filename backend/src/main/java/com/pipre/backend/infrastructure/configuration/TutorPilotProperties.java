package com.pipre.backend.infrastructure.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Min;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Component
@Validated
@ConfigurationProperties(prefix = "pipre.tutor")
public class TutorPilotProperties {
    private boolean enabled;
    @Min(1)
    private int maxHints = 3;
    private List<String> allowedActivityIds = new ArrayList<>();
    private List<String> allowedGroupIds = new ArrayList<>();
}
