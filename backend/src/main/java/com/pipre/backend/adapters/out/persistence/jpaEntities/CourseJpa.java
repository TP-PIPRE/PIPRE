package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseJpa {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_course", updatable = false, nullable = false)
    private UUID idCourse;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "level")
    private String level;

    @Column(name = "objective", columnDefinition = "TEXT")
    private String objective;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "courseJpa", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ModuleJpa> moduleJpas = new ArrayList<>();

    public void addModule(ModuleJpa module) {
        moduleJpas.add(module);
        module.setCourseJpa(this);
    }
}