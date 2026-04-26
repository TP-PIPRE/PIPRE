package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.Set;

@Entity
@Table(name = "modules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModuleJpa {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_module", updatable = false, nullable = false)
    private UUID idModule;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "difficulty")
    private String difficulty;

    @Column(name = "module_order")
    private Integer moduleOrder;

    @Column(name = "percentage_meta", precision = 5, scale = 2)
    private BigDecimal percentageMeta;

    @OneToMany(mappedBy = "moduleJpa", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<LessonJpa> lessonJpas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_course", nullable = false)
    private CourseJpa courseJpa;
}
