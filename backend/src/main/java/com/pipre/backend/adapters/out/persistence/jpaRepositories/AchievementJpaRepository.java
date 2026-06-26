package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.AchievementJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AchievementJpaRepository extends JpaRepository<AchievementJpaEntity, String> {
    Optional<AchievementJpaEntity> findByCode(String code);
}
