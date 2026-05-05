package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
@Getter
public class Simulation {

    private final String idSimulation;
    private final Boolean isRandom;
    private final Integer blocksUsage;
    private final Integer codeUsage;
    private final BigDecimal sensorError;
    private final String blocklyCode;
    private final String pythonCode;
    private final Integer resolutionTime;
    private final String result;
    private final LocalDateTime date;
    private final String idStudent;
    private final String idActivity;

}
