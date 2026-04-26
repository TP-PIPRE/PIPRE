package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.util.Set;

@Entity
@Table(name = "activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityJpa {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_activity", updatable = false, nullable = false)
    private UUID idActivity;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "complexity")
    private String complexity;

    @Column(name = "difficulty")
    private String difficulty;

    @Column(name = "logic_level")
    private Integer logicLevel;

    @Column(name = "type")
    private String type;

    @OneToMany(mappedBy = "activityJpa", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<RoboticsSimulationJpa> roboticsSimulationJpas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_lesson", nullable = false)
    private LessonJpa lessonJpa;
}
