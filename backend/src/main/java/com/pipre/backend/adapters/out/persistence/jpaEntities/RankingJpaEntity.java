package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_students")
@NoArgsConstructor
@Getter
@Setter
public class RankingJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idRanking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_group", nullable = false)
    private GroupJpaEntity groupJpaEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpaEntity;

    private Integer position;
    private BigDecimal totalPoints;

    // Gamification fields (from V11 migration)
    private Integer level;
    private Integer xpTotal;
    private Integer totalStars;
    private Integer currentStreak;
    private Integer maxStreak;
    private LocalDateTime updatedAt;
}
