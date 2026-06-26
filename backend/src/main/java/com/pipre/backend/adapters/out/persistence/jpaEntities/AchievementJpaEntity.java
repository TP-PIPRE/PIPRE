package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "achievements")
@NoArgsConstructor
@Getter
@Setter
public class AchievementJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idAchievement;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String icon;
    private String category;
    private Integer xpReward;
    private Boolean hidden;
}
