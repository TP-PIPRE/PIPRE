package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.DropoutRiskJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DropoutRiskJpaRepository extends JpaRepository<DropoutRiskJpaEntity, String> {
    Optional<DropoutRiskJpaEntity> findByStudentJpaEntityIdUser(String idStudent);
}
