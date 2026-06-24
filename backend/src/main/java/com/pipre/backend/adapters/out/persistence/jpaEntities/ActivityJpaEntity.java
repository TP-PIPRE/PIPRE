package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "activities")
@NoArgsConstructor
@Getter
@Setter
public class ActivityJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idActivity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lesson", nullable = false)
    private LessonJpaEntity lessonJpaEntity;

    @Column(nullable = false)
    private String name;

    private String logicLevel;

    private String complexity;

    private String difficulty;

    private String type;

    private String environment;

    @Column(name = "start_x")
    private Double startX;

    @Column(name = "start_z")
    private Double startZ;

    @Column(name = "target_x")
    private Double targetX;

    @Column(name = "target_z")
    private Double targetZ;

    @OneToMany(mappedBy = "activityJpaEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SimulationJpaEntity> simulationJpaEntityList = new ArrayList<>();

    @OneToMany(mappedBy = "activityJpaEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ActivityMissionJpaEntity> missions = new ArrayList<>();
}
