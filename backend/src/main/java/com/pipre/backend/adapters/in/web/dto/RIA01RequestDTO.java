package com.pipre.backend.adapters.in.web.dto;

public record RIA01RequestDTO(
        Integer attempts,
        Integer errors,
        String logicLevel,
        Float aiInteractions
) {
}
