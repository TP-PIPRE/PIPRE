package com.pipre.backend.domain.entities;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
@Getter
public class ModuleProgress {

    private final String idProgress;
    private final BigDecimal percentage;
    private final String status;
    private final LocalDateTime updatedAt;
    private final String idStudent;
    private final String idModule;

}
