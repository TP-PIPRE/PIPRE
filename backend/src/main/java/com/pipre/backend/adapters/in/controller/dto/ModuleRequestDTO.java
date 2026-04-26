package com.pipre.backend.adapters.in.controller.dto;

import java.util.UUID;

public record ModuleRequestDTO(
        UUID idCourse,
        String title
) {
}
