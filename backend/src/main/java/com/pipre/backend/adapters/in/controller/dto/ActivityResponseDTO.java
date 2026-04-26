package com.pipre.backend.adapters.in.controller.dto;

import java.util.UUID;

public record ActivityResponseDTO(
        UUID idActivity,
        String name
) {
}
