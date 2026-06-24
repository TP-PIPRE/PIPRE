package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "activity_missions")
@NoArgsConstructor
@Getter
@Setter
public class ActivityMissionJpaEntity {

    @Id
    @Column(name = "id_mission", updatable = false, nullable = false)
    private String idMission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_activity", nullable = false)
    private ActivityJpaEntity activityJpaEntity;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String objective;

    @Column(name = "max_blocks")
    private Integer maxBlocks;
}
