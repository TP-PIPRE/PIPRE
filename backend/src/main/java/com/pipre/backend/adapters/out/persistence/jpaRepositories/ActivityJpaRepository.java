package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityJpaRepository extends JpaRepository<ActivityJpaEntity, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select a from ActivityJpaEntity a where a.idActivity=:id")
    java.util.Optional<ActivityJpaEntity> lockById(@org.springframework.data.repository.query.Param("id") String id);
    @org.springframework.data.jpa.repository.Query(value="SELECT a.* FROM activities a JOIN group_activities ga ON ga.id_activity=a.id_activity WHERE ga.id_group=:id AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module JOIN group_courses gc ON gc.id_course=m.id_course WHERE l.id_lesson=a.id_lesson AND gc.id_group=ga.id_group) ORDER BY a.display_order,a.id_activity",countQuery="SELECT COUNT(*) FROM activities a JOIN group_activities ga ON ga.id_activity=a.id_activity WHERE ga.id_group=:id AND EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id_module=l.id_module JOIN group_courses gc ON gc.id_course=m.id_course WHERE l.id_lesson=a.id_lesson AND gc.id_group=ga.id_group)",nativeQuery=true)
    Page<ActivityJpaEntity> assignedToGroup(@org.springframework.data.repository.query.Param("id") String id,Pageable pageable);
    List<ActivityJpaEntity> findByLessonJpaEntity_IdLesson(String idLesson);
    Page<ActivityJpaEntity> findByLessonJpaEntity_IdLesson(String idLesson, Pageable pageable);
}
