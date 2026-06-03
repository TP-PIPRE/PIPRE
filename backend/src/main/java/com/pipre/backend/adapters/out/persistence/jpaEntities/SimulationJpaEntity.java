package com.pipre.backend.adapters.out.persistence.jpaEntities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "simulations")
@NoArgsConstructor
@Getter
@Setter
public class SimulationJpaEntity {
    @Id
    @Column(updatable = false, nullable = false)
    private String idSimulation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_student", nullable = false)
    private UserJpaEntity studentJpaEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_activity", nullable = false)
    private ActivityJpaEntity activityJpaEntity;

    private String result;
}
