package com.pipre.backend.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Simulation {

    private String idSimulation;
    private Boolean isRandom;
    private Integer blocksUsage;
    private Integer codeUsage;
    private BigDecimal sensorError;
    private String blocklyCode;
    private String pythonCode;
    private Integer resolutionTime;
    private String result;
    private LocalDateTime date;
    private String idStudent;
    private String idActivity;

}
