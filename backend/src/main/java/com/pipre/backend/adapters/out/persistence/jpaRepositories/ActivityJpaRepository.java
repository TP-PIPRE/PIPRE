package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityJpaRepository extends JpaRepository<ActivityJpaEntity, String> {
    List<ActivityJpaEntity> findByLessonJpaEntity_IdLesson(String idLesson);
    Page<ActivityJpaEntity> findByLessonJpaEntity_IdLesson(String idLesson, Pageable pageable);
}
