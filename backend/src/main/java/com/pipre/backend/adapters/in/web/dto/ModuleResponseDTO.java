package com.pipre.backend.adapters.in.web.dto;

import java.util.UUID;

public record ModuleResponseDTO(
        UUID idModule,
        String title
) {
}
