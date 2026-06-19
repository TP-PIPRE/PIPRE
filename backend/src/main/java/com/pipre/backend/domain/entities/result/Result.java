package com.pipre.backend.domain.entities.result;

import com.pipre.backend.domain.exceptions.BusinessException;
import java.math.BigDecimal;

public class Result {

    private final String idResult;
    private final Integer attempts;
    private final Integer errors;
    private final BigDecimal score;
    private final String resultSimulation;
    private final String idStudent;
    private final String idActivity;

    Result(String idResult, Integer attempts, Integer errors, BigDecimal score, String resultSimulation, String idStudent, String idActivity) {
        if (idResult == null || idResult.isBlank()) {
            throw new BusinessException("El ID del resultado es obligatorio.");
        }
        if (idStudent == null || idStudent.isBlank()) {
            throw new BusinessException("El ID del estudiante es obligatorio.");
        }
        if (idActivity == null || idActivity.isBlank()) {
            throw new BusinessException("El ID de la actividad es obligatorio.");
        }
        if (attempts != null && attempts < 0) {
            throw new BusinessException("El número de intentos no puede ser negativo.");
        }
        if (errors != null && errors < 0) {
            throw new BusinessException("El número de errores no puede ser negativo.");
        }
        if (score != null && score.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("El puntaje no puede ser negativo.");
        }

        this.idResult = idResult;
        this.attempts = attempts;
        this.errors = errors;
        this.score = score;
        this.resultSimulation = resultSimulation;
        this.idStudent = idStudent;
        this.idActivity = idActivity;
    }

    public static ResultBuilder builder() {
        return new ResultBuilder();
    }

    public String getIdResult() {
        return this.idResult;
    }

    public Integer getAttempts() {
        return this.attempts;
    }

    public Integer getErrors() {
        return this.errors;
    }

    public BigDecimal getScore() {
        return this.score;
    }

    public String getResultSimulation() {
        return this.resultSimulation;
    }

    public String getIdStudent() {
        return this.idStudent;
    }

    public String getIdActivity() {
        return this.idActivity;
    }

    public static class ResultBuilder {
        private String idResult;
        private Integer attempts;
        private Integer errors;
        private BigDecimal score;
        private String resultSimulation;
        private String idStudent;
        private String idActivity;

        ResultBuilder() {
        }

        public ResultBuilder idResult(String idResult) {
            this.idResult = idResult;
            return this;
        }

        public ResultBuilder attempts(Integer attempts) {
            this.attempts = attempts;
            return this;
        }

        public ResultBuilder errors(Integer errors) {
            this.errors = errors;
            return this;
        }

        public ResultBuilder score(BigDecimal score) {
            this.score = score;
            return this;
        }

        public ResultBuilder resultSimulation(String resultSimulation) {
            this.resultSimulation = resultSimulation;
            return this;
        }

        public ResultBuilder idStudent(String idStudent) {
            this.idStudent = idStudent;
            return this;
        }

        public ResultBuilder idActivity(String idActivity) {
            this.idActivity = idActivity;
            return this;
        }

        public Result build() {
            return new Result(this.idResult, this.attempts, this.errors, this.score, this.resultSimulation, this.idStudent, this.idActivity);
        }

        public String toString() {
            return "Result.ResultBuilder(idResult=" + this.idResult + ", attempts=" + this.attempts + ", errors=" + this.errors + ", score=" + this.score + ", resultSimulation=" + this.resultSimulation + ", idStudent=" + this.idStudent + ", idActivity=" + this.idActivity + ")";
        }
    }
}
