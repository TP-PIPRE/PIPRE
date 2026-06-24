package com.pipre.backend.application.commands;

import java.math.BigDecimal;

public record SaveModuleProgressCommand(
        String idStudent,
        String idModule,
        BigDecimal percentage,
        String status
) {}
