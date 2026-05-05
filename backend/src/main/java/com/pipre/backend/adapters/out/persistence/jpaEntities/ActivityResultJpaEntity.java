package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_results")
@NoArgsConstructor
public class ActivityResultJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private UUID idResult;

    private Integer attempts;

    private Integer errors;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    private Integer doneCount;

    @Column(precision = 5, scale = 2)
    private BigDecimal successRate;

    private LocalDateTime date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_activity", nullable = false)
    private ActivityJpaEntity activityJpaEntity;
}
