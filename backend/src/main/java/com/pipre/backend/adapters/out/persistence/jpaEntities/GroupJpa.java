package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.util.Set;

@Entity
@Table(name = "groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupJpa {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_group", updatable = false, nullable = false)
    private UUID idGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_teacher")
    private UserJpa teacher;

    @Column(name = "group_name", nullable = false)
    private String groupName;

    @Column(name = "grade")
    private String grade;

    @Column(name = "section")
    private String section;

    @OneToMany(mappedBy = "groupJpa", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<GroupStudentJpa> groupStudentJpas;
}
