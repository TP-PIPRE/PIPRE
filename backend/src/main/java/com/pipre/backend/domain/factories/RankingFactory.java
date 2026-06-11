package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.ranking.Ranking;

import java.math.BigDecimal;
import java.util.UUID;

public class RankingFactory {
    public static Ranking createNewRanking(
            String idGroup,
            String idStudent,
            BigDecimal totalPoints
    ) {
        return Ranking.builder()
                .idRanking(UUID.randomUUID().toString())
                .totalPoints(totalPoints)
                .idGroup(idGroup)
                .idStudent(idStudent)
                .build();
    }
}
