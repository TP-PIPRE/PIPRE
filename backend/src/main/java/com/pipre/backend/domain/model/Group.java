package com.pipre.backend.domain.model;

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
public class Group {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_group", updatable = false, nullable = false)
    private UUID idGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_teacher")
    private User teacher;

    @Column(name = "group_name", nullable = false)
    private String groupName;

    @Column(name = "grade")
    private String grade;

    @Column(name = "section")
    private String section;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<GroupStudent> groupStudents;
}
