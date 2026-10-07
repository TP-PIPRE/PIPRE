package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "telemetry_attempts")
@NoArgsConstructor
@Getter
@Setter
public class TelemetryAttemptJpaEntity {
    @Id
    @Column(name = "id_attempt", updatable = false, nullable = false)
    private String idAttempt;

    @Column(name = "id_student", nullable = false)
    private String studentId;

    @Column(nullable = false)
    private String game;

    @Column(nullable = false)
    private String result;

    @Column(name = "tiempo_resolucion")
    private Integer tiempoResolucion;

    private Integer movimientos;

    private Integer reinicios;

    @Column(name = "pistas_ia")
    private Integer pistasIa;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
