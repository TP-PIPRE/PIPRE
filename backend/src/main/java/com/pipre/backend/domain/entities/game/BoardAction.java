package com.pipre.backend.domain.entities.game;

public record BoardAction(String type, String pieceId, Integer x, Integer y, Integer rotation,
        String component, String color, String source) {}
