package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "activities")
@NoArgsConstructor
public class ActivityJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idActivity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lesson", nullable = false)
    private LessonJpaEntity lessonJpaEntity;

    @Column(nullable = false)
    private String name;

    private String difficulty;
    private Integer logicLevel;
    private String type;

    @OneToMany(mappedBy = "activityJpaEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SimulationJpaEntity> simulationJpaEntityList = new ArrayList<>();

}
