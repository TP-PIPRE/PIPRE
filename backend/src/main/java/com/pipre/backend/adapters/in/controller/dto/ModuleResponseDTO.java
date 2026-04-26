package com.pipre.backend.adapters.in.controller.dto;

import java.util.UUID;

public record ModuleResponseDTO(
        UUID idModule,
        String title
) {
}
