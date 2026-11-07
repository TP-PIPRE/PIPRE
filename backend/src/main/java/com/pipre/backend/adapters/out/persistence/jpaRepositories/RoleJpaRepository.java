package com.pipre.backend.adapters.out.persistence.jpaRepositories;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RoleJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleJpaRepository extends JpaRepository<RoleJpaEntity, String> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select r from RoleJpaEntity r where r.name='ADMIN'")
    java.util.Optional<RoleJpaEntity> lockAdministration();
    @org.springframework.data.jpa.repository.Query(value="SELECT COUNT(DISTINCT u.id_user) FROM users u JOIN user_role ur ON ur.id_user=u.id_user JOIN roles r ON r.id_role=ur.id_role WHERE r.name='ADMIN' AND u.is_active=TRUE",nativeQuery=true)
    long activeAdministrators();
}
