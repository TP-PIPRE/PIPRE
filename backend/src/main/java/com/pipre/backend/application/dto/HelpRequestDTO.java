package com.pipre.backend.application.dto;

import java.time.LocalDateTime;

public record HelpRequestDTO(
        String idHelpRequest,
        Integer aiInteractions,
        LocalDateTime requestedAt,
        String idStudent
) {}
