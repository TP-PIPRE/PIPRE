package com.pipre.backend.application.dto;

import java.math.BigDecimal;

public record StudentHistoryDTO(
        String idResult,
        String idActivity,
        String activityName,
        BigDecimal score,
        Integer stars,
        Integer xpEarned,
        Double efficiency,
        String dateAttempted,
        String source
) {
    public StudentHistoryDTO(String idResult,String idActivity,String activityName,BigDecimal score,Integer stars,Integer xpEarned,Double efficiency,String dateAttempted) {
        this(idResult,idActivity,activityName,score,stars,xpEarned,efficiency,dateAttempted,"LEGACY_DECLARED");
    }
}
