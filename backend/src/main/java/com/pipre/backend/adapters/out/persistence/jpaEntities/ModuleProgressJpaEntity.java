package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "module_progress")
@NoArgsConstructor
@Getter
@Setter
public class ModuleProgressJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idProgress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpaEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_module", nullable = false)
    private ModuleJpaEntity moduleJpaEntity;

    @Column(precision = 5, scale = 2, columnDefinition = "DECIMAL(5,2) DEFAULT 0")
    private BigDecimal percentage;

    private String status;
    private LocalDateTime updatedAt;
}
