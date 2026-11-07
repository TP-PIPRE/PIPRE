package com.pipre.backend.application.commands;

import java.math.BigDecimal;

public record SaveResultCommand(
        @jakarta.validation.constraints.NotBlank String idStudent,
        @jakarta.validation.constraints.NotBlank String idActivity,
        @jakarta.validation.constraints.DecimalMin("0") BigDecimal score,
        @jakarta.validation.constraints.Min(0) Integer attempts
) {}
