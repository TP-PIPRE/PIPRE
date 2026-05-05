package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "lessons")
@NoArgsConstructor
public class LessonJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private UUID idLesson;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String resourceType;

    @OneToMany(mappedBy = "lessonJpa", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ActivityJpaEntity> activitiesJpas = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_module", nullable = false)
    private ModuleJpaEntity moduleJpaEntity;

    public void addActivity(ActivityJpaEntity activity) {
        activitiesJpas.add(activity);
        activity.setLessonJpa(this);
    }
}
