package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityResultJpa {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_result", updatable = false, nullable = false)
    private UUID idResult;

    @Column(name = "attempts", columnDefinition = "INTEGER DEFAULT 0")
    private Integer attempts;

    @Column(name = "errors", columnDefinition = "INTEGER DEFAULT 0")
    private Integer errors;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "done_count", columnDefinition = "INTEGER DEFAULT 0")
    private Integer doneCount;

    @Column(name = "success_rate", precision = 5, scale = 2)
    private BigDecimal successRate;

    @Column(name = "date")
    private LocalDateTime date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_activity", nullable = false)
    private ActivityJpa activityJpa;
}
