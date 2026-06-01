package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RankingJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RankingJpaRepository extends JpaRepository<RankingJpaEntity, String> {
    List<RankingJpaEntity> findAllByGroupJpaEntityIdGroupOrderByPositionAsc(String idGroup);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        UPDATE group_students gs
        SET position = ranked.pos
        FROM (
            SELECT id_ranking,
               DENSE_RANK() OVER (
                ORDER BY total_points DESC
               ) as pos
            FROM group_students
            WHERE id_group = :idGroup
        ) ranked
        WHERE gs.id_ranking = ranked.id_ranking
            AND gs.id_group = :idGroup
    """, nativeQuery = true)
    void sortRanking(@Param("idGroup") String idGroup);
}
