package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuleJpaRepository extends JpaRepository<ModuleJpaEntity, String> {
    List<ModuleJpaEntity> findAllByCourseJpaEntity_IdCourse(String courseJpaEntityIdCourse);
}
