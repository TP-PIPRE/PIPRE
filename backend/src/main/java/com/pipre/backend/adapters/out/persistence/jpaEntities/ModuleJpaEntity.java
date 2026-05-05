package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "modules")
@NoArgsConstructor
public class ModuleJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idModule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_course", nullable = false)
    private CourseJpaEntity courseJpaEntity;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Boolean isAvailable;
    private Integer moduleOrder;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentageMeta;

    @OneToMany(mappedBy = "moduleJpaEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LessonJpaEntity> lessonJpaEntityList = new ArrayList<>();

//    public void addLesson(LessonJpaEntity lessonJpaEntity) {
//        lessonJpaEntities.add(lessonJpaEntity);
//        lessonJpaEntity.setModuleJpa(this);
//    }
}
