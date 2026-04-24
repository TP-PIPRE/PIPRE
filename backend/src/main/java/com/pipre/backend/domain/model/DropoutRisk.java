package com.pipre.backend.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "dropout_risks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DropoutRisk {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_risk", updatable = false, nullable = false)
    private UUID idRisk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private User student;

    @Column(name = "days_inactive")
    private Integer daysInactive;

    @Column(name = "performance")
    private String performance;

    @Column(name = "risk_level")
    private String riskLevel;

    @Column(name = "motivation_level")
    private String motivationLevel;

    @Column(name = "analysis_date")
    private LocalDateTime analysisDate;
}
