package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.HelpRequestJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HelpRequestJpaRepository extends JpaRepository<HelpRequestJpaEntity, String> {
    List<HelpRequestJpaEntity> findAllByStudentJpaEntityIdUser(String idStudent);
}
