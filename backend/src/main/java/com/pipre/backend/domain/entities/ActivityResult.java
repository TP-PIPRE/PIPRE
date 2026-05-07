package com.pipre.backend.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ActivityResult {

    private String idResult;
    private Integer attempts;
    private Integer errors;
    private BigDecimal score;
    private Integer doneCount;
    private BigDecimal successRate;
    private LocalDateTime date;
    private String idStudent;
    private String idActivity;

}
