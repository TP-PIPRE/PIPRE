package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.util.Set;

@Entity
@Table(name = "groups")
@NoArgsConstructor
public class GroupJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private UUID idGroup;

    @Column(nullable = false)
    private String groupName;

    private String grade;
    private String section;

    @OneToMany(mappedBy = "groupJpa", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<GroupStudentJpaEntity> groupStudentJpaEntities;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_teacher")
    private UserJpaEntity teacher;
}
