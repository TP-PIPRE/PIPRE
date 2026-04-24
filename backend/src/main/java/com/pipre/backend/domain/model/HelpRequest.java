package com.pipre.backend.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "help_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HelpRequest {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_help_request", updatable = false, nullable = false)
    private UUID idHelpRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private User student;

    @Column(name = "times_requested", columnDefinition = "INTEGER DEFAULT 0")
    private Integer timesRequested;

    @Column(name = "ai_interactions", columnDefinition = "INTEGER DEFAULT 0")
    private Integer aiInteractions;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;
}
