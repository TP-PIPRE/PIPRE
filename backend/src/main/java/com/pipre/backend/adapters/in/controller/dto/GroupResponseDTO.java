package com.pipre.backend.adapters.in.controller.dto;

import java.util.UUID;

public record GroupResponseDTO(
        UUID idGroup,
        String groupName
) {
}
