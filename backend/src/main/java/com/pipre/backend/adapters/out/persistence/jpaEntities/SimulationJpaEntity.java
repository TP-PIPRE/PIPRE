package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "simulations")
@NoArgsConstructor
public class SimulationJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idSimulation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpaEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_activity", nullable = false)
    private ActivityJpaEntity activityJpaEntity;

    @Column(precision = 10, scale = 2)
    private BigDecimal sensorError;

    @Column(columnDefinition = "TEXT")
    private String blocklyCode;

    @Column(columnDefinition = "TEXT")
    private String pythonCode;

    private Boolean isRandom;
    private Integer blocksUsage;
    private Integer codeUsage;
    private Integer resolutionTime;
    private String result;
    private LocalDateTime date;
}
