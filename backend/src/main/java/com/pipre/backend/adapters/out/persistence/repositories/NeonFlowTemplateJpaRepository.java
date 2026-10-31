package com.pipre.backend.adapters.out.persistence.repositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.NeonFlowTemplateJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NeonFlowTemplateJpaRepository extends JpaRepository<NeonFlowTemplateJpaEntity, String> {}
