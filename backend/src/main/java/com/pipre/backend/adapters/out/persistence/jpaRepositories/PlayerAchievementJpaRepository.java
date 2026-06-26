package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.PlayerAchievementJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerAchievementJpaRepository extends JpaRepository<PlayerAchievementJpaEntity, String> {
    List<PlayerAchievementJpaEntity> findByStudentJpaEntityIdUser(String idStudent);
    boolean existsByStudentJpaEntityIdUserAndAchievementJpaEntityCode(String idStudent, String code);
}
