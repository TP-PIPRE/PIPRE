package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.util.Set;

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
    @Column(name = "id_lesson", updatable = false, nullable = false)
    private UUID idLesson;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "resource_type")
    private String resourceType;

    @OneToMany(mappedBy = "lessonJpa", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ActivityJpa> activitiesJpa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_module", nullable = false)
    private ModuleJpa moduleJpa;
}
