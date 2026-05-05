package com.pipre.backend.adapters.out.persistence.repository;

import com.pipre.backend.adapters.out.persistence.jpaEntities.GroupStudentJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupStudentJpaRepository extends JpaRepository<GroupStudentJpaEntity, String> {

}
