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

    @Column(nullable = false)
    private String logicLevel;

    @OneToMany(mappedBy = "activityJpaEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SimulationJpaEntity> simulationJpaEntityList = new ArrayList<>();

}
