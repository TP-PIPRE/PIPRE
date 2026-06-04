package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "help_requests")
@NoArgsConstructor
@Getter
@Setter
public class HelpRequestJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idHelpRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpaEntity;

    private Integer timesRequested;
    private Integer aiInteractions;
    private LocalDateTime requestedAt;
}
