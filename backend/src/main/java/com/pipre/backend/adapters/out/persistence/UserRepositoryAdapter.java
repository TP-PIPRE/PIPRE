package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RoleJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpaEntity;
import com.pipre.backend.adapters.out.persistence.mapper.UserMapper;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.RoleJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.UserJpaRepository;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepositoryPort {

    private final UserJpaRepository jpaRepository;
    private final RoleJpaRepository roleJpaRepository;

    @Override
    public void save(User user) {
        UserJpaEntity entity = UserMapper.toJpaEntity(user);
        if (user.getIdRoleList() != null && !user.getIdRoleList().isEmpty()) {
            List<RoleJpaEntity> roleJpaList = roleJpaRepository.findAllById(user.getIdRoleList());
            entity.setRoleJpaEntityList(roleJpaList);
        }
        jpaRepository.save(entity);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }

    @Override
    public Optional<User> findById(String id) {
        return jpaRepository.findById(id)
                .map(UserMapper::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpaRepository.findByEmail(email)
                .map(UserMapper::toDomain);
    }

    @Override
    public int count() {
        return (int) jpaRepository.count();
    }

    @Override
    public List<User> findAll() {
        return jpaRepository.findAll()
                .stream()
                .map(UserMapper::toDomain)
                .toList();
    }
}
