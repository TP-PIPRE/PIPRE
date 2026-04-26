package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonJpa {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "idLesson", updatable = false, nullable = false)
    private UUID idLesson;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "resource_type")
    private String resourceType;

    @Builder.Default
    @OneToMany(mappedBy = "lessonJpa", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ActivityJpa> activitiesJpas = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_module", nullable = false)
    private ModuleJpa moduleJpa;

    public void addActivity(ActivityJpa activity) {
        activitiesJpas.add(activity);
        activity.setLessonJpa(this);
    }
}
