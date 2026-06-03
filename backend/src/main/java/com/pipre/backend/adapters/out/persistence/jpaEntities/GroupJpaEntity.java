package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "groups")
@NoArgsConstructor
@Getter
@Setter
public class GroupJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idGroup;

    @Column(nullable = false)
    private String groupName;

    @OneToMany(mappedBy = "groupJpaEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RankingJpaEntity> rankingJpaEntityList;
}
