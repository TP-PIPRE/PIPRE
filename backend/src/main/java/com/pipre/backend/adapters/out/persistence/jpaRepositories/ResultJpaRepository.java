package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ResultJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResultJpaRepository extends JpaRepository<ResultJpaEntity, String> {
    List<ResultJpaEntity> findByStudentJpaEntityIdUser(String studentJpaEntityIdUser);
    long countByStudentJpaEntityIdUser(String idStudent);

    @Query(value = """
        SELECT u.id_user AS idStudent,
               u.first_name || ' ' || u.last_name AS studentName,
               COALESCE(SUM(ar.score), 0) AS totalPoints,
               DENSE_RANK() OVER (ORDER BY COALESCE(SUM(ar.score), 0) DESC) AS position,
               1 AS level,
               0 AS xpTotal,
               0 AS totalStars,
               0 AS currentStreak,
               0 AS maxStreak
        FROM activity_results ar
        JOIN users u ON ar.id_student = u.id_user
        JOIN activities a ON ar.id_activity = a.id_activity
        JOIN lessons l ON a.id_lesson = l.id_lesson
        JOIN modules m ON l.id_module = m.id_module
        WHERE m.id_course = :courseId
        GROUP BY u.id_user, u.first_name, u.last_name
        ORDER BY position
    """, nativeQuery = true)
    List<Object[]> findCourseRankingRaw(@Param("courseId") String courseId);

    @Query(value = """
        SELECT u.id_user AS idStudent,
               u.first_name || ' ' || u.last_name AS studentName,
               COALESCE(SUM(ar.score), 0) AS totalPoints,
               DENSE_RANK() OVER (ORDER BY COALESCE(SUM(ar.score), 0) DESC) AS position,
               1 AS level,
               0 AS xpTotal,
               0 AS totalStars,
               0 AS currentStreak,
               0 AS maxStreak
        FROM activity_results ar
        JOIN users u ON ar.id_student = u.id_user
        JOIN activities a ON ar.id_activity = a.id_activity
        JOIN lessons l ON a.id_lesson = l.id_lesson
        WHERE l.id_module = :moduleId
        GROUP BY u.id_user, u.first_name, u.last_name
        ORDER BY position
    """, nativeQuery = true)
    List<Object[]> findModuleRankingRaw(@Param("moduleId") String moduleId);
}
