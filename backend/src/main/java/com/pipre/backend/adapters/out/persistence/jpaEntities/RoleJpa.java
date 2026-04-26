package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleJpa {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id_role", updatable = false, nullable = false)
    private UUID idRole;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;
}
