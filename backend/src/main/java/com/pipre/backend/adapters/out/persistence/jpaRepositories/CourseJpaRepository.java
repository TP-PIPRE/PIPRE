package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseJpaRepository extends JpaRepository<CourseJpaEntity, String> {
}
