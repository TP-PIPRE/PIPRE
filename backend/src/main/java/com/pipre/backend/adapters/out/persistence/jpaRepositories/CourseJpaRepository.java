package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseJpaRepository extends JpaRepository<CourseJpaEntity, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from CourseJpaEntity c where c.idCourse=:id")
    java.util.Optional<CourseJpaEntity> lockById(@org.springframework.data.repository.query.Param("id") String id);
    org.springframework.data.domain.Page<CourseJpaEntity> findByIdCourseIn(java.util.Set<String> ids,org.springframework.data.domain.Pageable pageable);
}
