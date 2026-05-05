package com.pipre.backend.adapters.in.web.dto;

import java.util.UUID;

public record ActivityResponseDTO(
        UUID idActivity,
        String name
) {
}
