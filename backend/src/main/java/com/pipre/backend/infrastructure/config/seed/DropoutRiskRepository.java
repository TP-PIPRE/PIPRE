package com.pipre.backend.infrastructure.config.seed;

import com.pipre.backend.domain.model.DropoutRisk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DropoutRiskRepository extends JpaRepository<DropoutRisk, UUID> {
}
