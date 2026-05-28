package com.pipre.backend.domain;

import java.math.BigDecimal;
import java.util.Map;

public record Prediction(
        String result,
        BigDecimal accuracy,
        BigDecimal precision,
        Map<String, Object> details
) {
}
