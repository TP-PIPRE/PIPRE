package com.pipre.backend.adapters.in.web.dto;

import java.util.UUID;

public record ModuleRequestDTO(
        UUID idCourse,
        String title
) {
}
