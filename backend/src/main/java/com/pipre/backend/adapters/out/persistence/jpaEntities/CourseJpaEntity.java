package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@NoArgsConstructor
@Setter
@Getter
public class CourseJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idCourse;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String level;

    @Column(columnDefinition = "TEXT")
    private String objective;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "courseJpaEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ModuleJpaEntity> moduleJpaEntityList = new ArrayList<>();

//    public void addModule(ModuleJpaEntity module) {
//        moduleJpaEntities.add(module);
//        module.setCourseJpaEntity(this);
//    }
}