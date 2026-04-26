package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "robotics_simulations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoboticsSimulationJpa {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_simulation", updatable = false, nullable = false)
    private UUID idSimulation;

    @Column(name = "is_random")
    private Boolean isRandom;

    @Column(name = "blocks_usage")
    private Integer blocksUsage;

    @Column(name = "code_usage")
    private Integer codeUsage;

    @Column(name = "sensor_error", precision = 10, scale = 2)
    private BigDecimal sensorError;

    @Column(name = "blockly_code", columnDefinition = "TEXT")
    private String blocklyCode;

    @Column(name = "python_code", columnDefinition = "TEXT")
    private String pythonCode;

    @Column(name = "resolution_time")
    private Integer resolutionTime;

    @Column(name = "result")
    private String result;

    @Column(name = "date")
    private LocalDateTime date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpa studentJpa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_activity", nullable = false)
    private ActivityJpa activityJpa;
}
