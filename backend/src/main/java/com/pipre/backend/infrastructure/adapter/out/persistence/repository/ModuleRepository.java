package com.pipre.backend.infrastructure.adapter.out.persistence.repository;

import com.pipre.backend.domain.model.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ModuleRepository extends JpaRepository<Module, UUID> {
}
