package com.pipre.backend.domain;

import java.util.Map;

public record Prediction(
        String result,
        Float accuracy,
        Float precision,
        Map<String, Object> details
) {
}
