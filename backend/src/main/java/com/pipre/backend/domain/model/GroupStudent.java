package com.pipre.backend.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "group_students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupStudent {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_ranking", updatable = false, nullable = false)
    private UUID idRanking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_group", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private User student;

    @Column(name = "total_points", columnDefinition = "INTEGER DEFAULT 0")
    private Integer totalPoints;

    @Column(name = "position")
    private Integer position;
}
