package com.pipre.backend.domain.entities.ranking;

import com.pipre.backend.domain.exceptions.BusinessException;
import java.math.BigDecimal;

public class Ranking {

    private final String idRanking;
    private final BigDecimal totalPoints;
    private final Integer position;
    private final String idGroup;
    private final String idStudent;

    Ranking(String idRanking, BigDecimal totalPoints, Integer position, String idGroup, String idStudent) {
        if (idRanking == null || idRanking.isBlank()) {
            throw new BusinessException("El ID del ranking es obligatorio.");
        }
        if (idGroup == null || idGroup.isBlank()) {
            throw new BusinessException("El ID del grupo es obligatorio.");
        }
        if (idStudent == null || idStudent.isBlank()) {
            throw new BusinessException("El ID del estudiante es obligatorio.");
        }
        if (position != null && position <= 0) {
            throw new BusinessException("La posición del ranking debe ser un número positivo.");
        }
        if (totalPoints != null && totalPoints.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Los puntos totales no pueden ser negativos.");
        }
        this.idRanking = idRanking;
        this.totalPoints = totalPoints;
        this.position = position;
        this.idGroup = idGroup;
        this.idStudent = idStudent;
    }

    public static RankingBuilder builder() {
        return new RankingBuilder();
    }

    public String getIdRanking() {
        return this.idRanking;
    }

    public BigDecimal getTotalPoints() {
        return this.totalPoints;
    }

    public Integer getPosition() {
        return this.position;
    }

    public String getIdGroup() {
        return this.idGroup;
    }

    public String getIdStudent() {
        return this.idStudent;
    }

    public static class RankingBuilder {
        private String idRanking;
        private BigDecimal totalPoints;
        private Integer position;
        private String idGroup;
        private String idStudent;

        RankingBuilder() {
        }

        public RankingBuilder idRanking(String idRanking) {
            this.idRanking = idRanking;
            return this;
        }

        public RankingBuilder totalPoints(BigDecimal totalPoints) {
            this.totalPoints = totalPoints;
            return this;
        }

        public RankingBuilder position(Integer position) {
            this.position = position;
            return this;
        }

        public RankingBuilder idGroup(String idGroup) {
            this.idGroup = idGroup;
            return this;
        }

        public RankingBuilder idStudent(String idStudent) {
            this.idStudent = idStudent;
            return this;
        }

        public Ranking build() {
            return new Ranking(this.idRanking, this.totalPoints, this.position, this.idGroup, this.idStudent);
        }

        public String toString() {
            return "Ranking.RankingBuilder(idRanking=" + this.idRanking + ", totalPoints=" + this.totalPoints + ", position=" + this.position + ", idGroup=" + this.idGroup + ", idStudent=" + this.idStudent + ")";
        }
    }
}
