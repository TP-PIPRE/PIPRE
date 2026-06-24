package com.pipre.backend.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ModuleProgressDTO(
        String idProgress,
        BigDecimal percentage,
        String status,
        LocalDateTime updatedAt,
        String idStudent,
        String idModule
) {}
