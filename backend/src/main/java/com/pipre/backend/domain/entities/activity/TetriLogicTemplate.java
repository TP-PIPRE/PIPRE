package com.pipre.backend.domain.entities.activity;

import java.util.Map;

/** Read-only, versioned official board configuration; contains no solved placements. */
public record TetriLogicTemplate(String templateId, int version, Map<String, Object> config) {}
