package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ResultJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResultJpaRepository extends JpaRepository<ResultJpaEntity, String> {
    List<ResultJpaEntity> findByStudentJpaEntityIdUser(String studentJpaEntityIdUser);
}
