package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.GroupJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.GroupJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.GroupMapper;
import com.pipre.backend.application.ports.output.GroupRepositoryPort;
import com.pipre.backend.domain.entities.group.Group;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class GroupRepositoryAdapter implements GroupRepositoryPort {
    private final GroupJpaRepository groupJpaRepository;
    private final GroupMapper groupMapper;

    @Override
    public List<Group> findAll() {
        return groupJpaRepository.findAll()
                .stream()
                .map(groupMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<Group> findById(String idGroup) {
        return groupJpaRepository.findById(idGroup)
                .map(groupMapper::toDomain);
    }

    @Override
    public void save(Group group) {
        GroupJpaEntity entity = groupMapper.toJpaEntity(group);
        groupJpaRepository.save(entity);
    }
}
