package com.pipre.backend.domain.model;

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
public class Module {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_module", updatable = false, nullable = false)
    private UUID idModule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_course", nullable = false)
    private Course course;

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

    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Lesson> lessons;
}
