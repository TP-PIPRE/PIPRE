package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "help_requests")
@NoArgsConstructor
public class HelpRequestJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private UUID idHelpRequest;

    private Integer timesRequested;
    private Integer aiInteractions;
    private LocalDateTime requestedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpa;
}
