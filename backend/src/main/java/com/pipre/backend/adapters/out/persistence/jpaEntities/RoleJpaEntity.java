package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "roles")
@NoArgsConstructor
public class RoleJpaEntity {
    @Id
    @Column(nullable = false, updatable = false, length = 36)
    private String idRole;

    @Column(nullable = false, length = 50)
    private String name;

    private String description;
}
