package com.pipre.backend.adapters.out.persistence.repository;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleProgressJpa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ModuleProgressRepository extends JpaRepository<ModuleProgressJpa, UUID> {
}
