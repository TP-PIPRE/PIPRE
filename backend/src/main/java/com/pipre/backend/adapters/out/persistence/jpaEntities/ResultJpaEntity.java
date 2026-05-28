package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_results")
@NoArgsConstructor
@Getter
@Setter
public class ResultJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpaEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_activity", nullable = false)
    private ActivityJpaEntity activityJpaEntity;

    private Integer attempts;
    private Integer errors;

    @Column(precision = 10, scale = 2)
    private BigDecimal score;

    private String resultSimulation;
    private LocalDateTime dateAttempted;

}
