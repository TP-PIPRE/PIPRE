package com.pipre.backend.domain.entities.helprequest;

import com.pipre.backend.domain.exceptions.BusinessException;
import java.time.LocalDateTime;

public class HelpRequest {

    private final String idHelpRequest;
    private final Integer aiInteractions;
    private final LocalDateTime requestedAt;
    private final String idStudent;

    HelpRequest(String idHelpRequest, Integer aiInteractions, LocalDateTime requestedAt, String idStudent) {
        if (idHelpRequest == null || idHelpRequest.isBlank()) {
            throw new BusinessException("El ID de la solicitud de ayuda es obligatorio.");
        }
        if (idStudent == null || idStudent.isBlank()) {
            throw new BusinessException("El ID del estudiante es obligatorio.");
        }
        if (requestedAt == null) {
            throw new BusinessException("La fecha de solicitud es obligatoria.");
        }
        if (aiInteractions != null && aiInteractions < 0) {
            throw new BusinessException("Las interacciones de IA no pueden ser negativas.");
        }
        this.idHelpRequest = idHelpRequest;
        this.aiInteractions = aiInteractions != null ? aiInteractions : 0;
        this.requestedAt = requestedAt;
        this.idStudent = idStudent;
    }

    public static HelpRequestBuilder builder() {
        return new HelpRequestBuilder();
    }

    public String getIdHelpRequest() {
        return this.idHelpRequest;
    }

    public Integer getAiInteractions() {
        return this.aiInteractions;
    }

    public LocalDateTime getRequestedAt() {
        return this.requestedAt;
    }

    public String getIdStudent() {
        return this.idStudent;
    }

    public static class HelpRequestBuilder {
        private String idHelpRequest;
        private Integer aiInteractions;
        private LocalDateTime requestedAt;
        private String idStudent;

        HelpRequestBuilder() {
        }

        public HelpRequestBuilder idHelpRequest(String idHelpRequest) {
            this.idHelpRequest = idHelpRequest;
            return this;
        }

        public HelpRequestBuilder aiInteractions(Integer aiInteractions) {
            this.aiInteractions = aiInteractions;
            return this;
        }

        public HelpRequestBuilder requestedAt(LocalDateTime requestedAt) {
            this.requestedAt = requestedAt;
            return this;
        }

        public HelpRequestBuilder idStudent(String idStudent) {
            this.idStudent = idStudent;
            return this;
        }

        public HelpRequest build() {
            return new HelpRequest(this.idHelpRequest, this.aiInteractions, this.requestedAt, this.idStudent);
        }

        public String toString() {
            return "HelpRequest.HelpRequestBuilder(idHelpRequest=" + this.idHelpRequest + ", aiInteractions=" + this.aiInteractions + ", requestedAt=" + this.requestedAt + ", idStudent=" + this.idStudent + ")";
        }
    }
}
