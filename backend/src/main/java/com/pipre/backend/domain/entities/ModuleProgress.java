package com.pipre.backend.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ModuleProgress {

    private String idProgress;
    private BigDecimal percentage;
    private String status;
    private LocalDateTime updatedAt;
    private String idStudent;
    private String idModule;

}
