package com.pipre.backend.application.commands;

import java.math.BigDecimal;

public record SaveModuleProgressCommand(
        @jakarta.validation.constraints.NotBlank String idStudent,
        @jakarta.validation.constraints.NotBlank String idModule,
        @jakarta.validation.constraints.DecimalMin("0") @jakarta.validation.constraints.DecimalMax("100") BigDecimal percentage,
        String status
) {}
