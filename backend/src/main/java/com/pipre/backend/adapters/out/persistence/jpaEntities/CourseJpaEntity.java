package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@NoArgsConstructor
public class CourseJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private UUID idCourse;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String level;

    @Column(columnDefinition = "TEXT")
    private String objective;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "courseJpa", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ModuleJpaEntity> moduleJpaEntities = new ArrayList<>();

    public void addModule(ModuleJpaEntity module) {
        moduleJpaEntities.add(module);
        module.setCourseJpaEntity(this);
    }
}