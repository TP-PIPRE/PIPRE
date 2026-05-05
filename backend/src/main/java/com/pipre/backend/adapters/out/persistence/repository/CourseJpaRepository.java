package com.pipre.backend.adapters.out.persistence.repository;

import com.pipre.backend.adapters.out.persistence.jpaEntities.CourseJpa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CourseJpaRepository extends JpaRepository<CourseJpa, String> {

    //refac
    CourseJpa findByIdCourse(UUID idCourse);

}
