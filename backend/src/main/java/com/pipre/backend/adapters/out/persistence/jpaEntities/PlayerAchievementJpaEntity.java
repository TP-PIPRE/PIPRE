package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "player_achievements")
@NoArgsConstructor
@Getter
@Setter
public class PlayerAchievementJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idPlayerAchievement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpaEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_achievement", nullable = false)
    private AchievementJpaEntity achievementJpaEntity;

    private LocalDateTime unlockedAt;
}
