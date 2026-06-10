package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.RoleJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.UserJpaEntity;
import com.pipre.backend.adapters.out.persistence.mapper.UserMapper;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.RoleJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.UserJpaRepository;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepositoryPort {

    private final UserJpaRepository jpaRepository;
    private final RoleJpaRepository roleJpaRepository;
    private final UserMapper userMapper;

    @Override
    public void save(User user) {
        UserJpaEntity entity = userMapper.toJpaEntity(user);
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
    @Transactional
    public Optional<User> findById(String id) {
        return jpaRepository.findById(id)
                .map(userMapper::toDomain);
    }

    @Override
    @Transactional
    public Optional<User> findByEmail(String email) {
        return jpaRepository.findByEmail(email)
                .map(userMapper::toDomain);
    }

    @Override
    public int count() {
        return (int) jpaRepository.count();
    }

    @Override
    @Transactional
    public List<User> findAll() {
        return jpaRepository.findAll()
                .stream()
                .map(userMapper::toDomain)
                .toList();
    }
}
