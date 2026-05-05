package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "dropout_risks")
@NoArgsConstructor
public class DropoutRiskJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idRisk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpaEntity;

    private Integer daysInactive;
    private String performance;
    private String riskLevel;
    private String motivationLevel;
    private LocalDateTime analysisDate;
}
