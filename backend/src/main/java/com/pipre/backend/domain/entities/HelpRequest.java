package com.pipre.backend.domain.entities;

import java.time.LocalDateTime;

public class HelpRequest {

    private final String idHelpRequest;
    private final Integer aiInteractions;
    private final LocalDateTime requestedAt;
    private final String idStudent;

    HelpRequest(String idHelpRequest, Integer aiInteractions, LocalDateTime requestedAt, String idStudent) {
        this.idHelpRequest = idHelpRequest;
        this.aiInteractions = aiInteractions;
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
