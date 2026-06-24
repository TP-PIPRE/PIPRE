package com.pipre.backend.application.dto;

import java.time.LocalDateTime;

public record DropoutRiskDTO(
        String idRisk,
        Integer daysInactive,
        String performance,
        String riskLevel,
        String motivationLevel,
        LocalDateTime analysisDate,
        String idStudent
) {}
