package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "module_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModuleProgressJpa {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_progress", updatable = false, nullable = false)
    private UUID idProgress;

    @Column(name = "percentage", precision = 5, scale = 2, columnDefinition = "DECIMAL(5,2) DEFAULT 0")
    private BigDecimal percentage;

    @Column(name = "status")
    private String status;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_module", nullable = false)
    private ModuleJpa moduleJpa;
}
