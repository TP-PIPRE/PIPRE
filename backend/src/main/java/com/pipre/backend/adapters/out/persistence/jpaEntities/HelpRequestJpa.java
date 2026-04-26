package com.pipre.backend.adapters.out.persistence.jpaEntities;

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
public class HelpRequestJpa {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_help_request", updatable = false, nullable = false)
    private UUID idHelpRequest;

    @Column(name = "times_requested", columnDefinition = "INTEGER DEFAULT 0")
    private Integer timesRequested;

    @Column(name = "ai_interactions", columnDefinition = "INTEGER DEFAULT 0")
    private Integer aiInteractions;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpa studentJpa;
}
