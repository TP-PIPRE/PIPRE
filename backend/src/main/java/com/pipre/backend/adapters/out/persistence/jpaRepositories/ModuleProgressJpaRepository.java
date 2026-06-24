package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleProgressJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleProgressJpaRepository extends JpaRepository<ModuleProgressJpaEntity, String> {
    Optional<ModuleProgressJpaEntity> findByStudentJpaEntityIdUserAndModuleJpaEntityIdModule(String idStudent, String idModule);
    List<ModuleProgressJpaEntity> findAllByStudentJpaEntityIdUser(String idStudent);
}
