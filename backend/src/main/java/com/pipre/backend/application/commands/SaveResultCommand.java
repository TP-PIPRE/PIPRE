package com.pipre.backend.application.commands;

import java.math.BigDecimal;

public record SaveResultCommand(
        String idStudent,
        String idActivity,
        BigDecimal score,
        Integer attempts
) {}
