package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lessons")
@NoArgsConstructor
@Getter
@Setter
public class LessonJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idLesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_module", nullable = false)
    private ModuleJpaEntity moduleJpaEntity;

    @Column(nullable = false)
    private String title;

    @OneToMany(mappedBy = "lessonJpaEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ActivityJpaEntity> activityJpaEntityList = new ArrayList<>();

}
