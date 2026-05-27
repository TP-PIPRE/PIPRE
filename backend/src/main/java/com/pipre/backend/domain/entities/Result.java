package com.pipre.backend.domain.entities;

public class Result {

    private final String idResult;
    private final Integer attempts;
    private final Integer errors;
    private final String idStudent;
    private final String idActivity;

    Result(String idResult, Integer attempts, Integer errors, String idStudent, String idActivity) {
        this.idResult = idResult;
        this.attempts = attempts;
        this.errors = errors;
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

        public ResultBuilder idStudent(String idStudent) {
            this.idStudent = idStudent;
            return this;
        }

        public ResultBuilder idActivity(String idActivity) {
            this.idActivity = idActivity;
            return this;
        }

        public Result build() {
            return new Result(this.idResult, this.attempts, this.errors, this.idStudent, this.idActivity);
        }

        public String toString() {
            return "Result.ResultBuilder(idResult=" + this.idResult + ", attempts=" + this.attempts + ", errors=" + this.errors + ", idStudent=" + this.idStudent + ", idActivity=" + this.idActivity + ")";
        }
    }
}
