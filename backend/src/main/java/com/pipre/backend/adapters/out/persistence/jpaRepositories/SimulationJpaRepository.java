package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.SimulationJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SimulationJpaRepository extends JpaRepository<SimulationJpaEntity, String> {
    List<SimulationJpaEntity> findAllByStudentJpaEntityIdUser(String studentJpaEntityIdUser);
}
