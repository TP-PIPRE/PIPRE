package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
@Getter
public class ActivityResult {

    private final String idResult;
    private final Integer attempts;
    private final Integer errors;
    private final BigDecimal score;
    private final Integer doneCount;
    private final BigDecimal successRate;
    private final LocalDateTime date;
    private final String idStudent;
    private final String idActivity;

}
