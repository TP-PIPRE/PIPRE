package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.GroupJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupJpaRepository extends JpaRepository<GroupJpaEntity, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select g from GroupJpaEntity g where g.idGroup = :id")
    java.util.Optional<GroupJpaEntity> lockById(@org.springframework.data.repository.query.Param("id") String id);
}
