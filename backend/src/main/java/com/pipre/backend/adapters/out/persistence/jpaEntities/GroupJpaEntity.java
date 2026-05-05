package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "groups")
@NoArgsConstructor
public class GroupJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_teacher")
    private UserJpaEntity teacherJpaEntity;

    @Column(nullable = false)
    private String groupName;

    private String grade;
    private String section;

    @OneToMany(mappedBy = "groupJpaEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupStudentJpaEntity> groupStudentJpaEntityList;
}
