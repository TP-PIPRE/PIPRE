package com.pipre.backend.adapters.out.persistence.repository;

import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CourseJpaRepository extends JpaRepository<CourseJpaEntity, String> {
    Boolean existsCourseJpaEntityByName(String name);

    //refac
    //CourseJpaEntity findByIdCourse(UUID idCourse);

}
