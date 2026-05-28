package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "modules")
@NoArgsConstructor
@Setter
@Getter
public class ModuleJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idModule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_course", nullable = false)
    private CourseJpaEntity courseJpaEntity;

    @Column(nullable = false)
    private String title;

    @OneToMany(mappedBy = "moduleJpaEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LessonJpaEntity> lessonJpaEntityList = new ArrayList<>();

}
