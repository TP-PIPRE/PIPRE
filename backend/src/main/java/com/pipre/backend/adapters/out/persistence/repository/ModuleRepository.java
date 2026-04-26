package com.pipre.backend.adapters.out.persistence.repository;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleJpa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ModuleRepository extends JpaRepository<ModuleJpa, UUID> {
}
