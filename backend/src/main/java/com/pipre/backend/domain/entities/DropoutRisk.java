package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Builder
@Getter
public class DropoutRisk {

    private final String idRisk;
    private final Integer daysInactive;
    private final String performance;
    private final String riskLevel;
    private final String motivationLevel;
    private final LocalDateTime analysisDate;
    private final String idStudent;

}
