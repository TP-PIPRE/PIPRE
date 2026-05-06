package com.pipre.backend.adapters.out.persistence.repository;

import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserJpaRepository extends JpaRepository<UserJpaEntity, String> {

    boolean existsByEmail(String email);

}
