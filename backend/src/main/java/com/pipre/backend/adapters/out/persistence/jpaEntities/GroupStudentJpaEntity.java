package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "group_students")
@NoArgsConstructor
public class GroupStudentJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private UUID idRanking;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer totalPoints;

    private Integer position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_group", nullable = false)
    private GroupJpaEntity groupJpaEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpa;
}
