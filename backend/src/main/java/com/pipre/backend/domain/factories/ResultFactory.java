package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.Result;

import java.math.BigDecimal;
import java.util.UUID;

public class ResultFactory {
    public static Result createNewResult(
            String idStudent,
            String idActivity,
            Integer attempts,
            BigDecimal score
    ) {
        return Result.builder()
                .idResult(UUID.randomUUID().toString())
                .attempts(attempts)
                .errors(null)
                .score(score)
                .resultSimulation(null)
                .idStudent(idStudent)
                .idActivity(idActivity)
                .build();
    }
}
