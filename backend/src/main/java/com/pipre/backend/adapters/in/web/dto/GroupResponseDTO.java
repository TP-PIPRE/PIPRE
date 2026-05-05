package com.pipre.backend.adapters.in.web.dto;

import java.util.UUID;

public record GroupResponseDTO(
        UUID idGroup,
        String groupName
) {
}
