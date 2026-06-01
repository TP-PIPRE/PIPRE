package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaRepositories.GroupJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.GroupMapper;
import com.pipre.backend.application.ports.output.GroupRepositoryPort;
import com.pipre.backend.domain.entities.Group;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class GroupRepositoryAdapter implements GroupRepositoryPort {
    private final GroupJpaRepository groupJpaRepository;

    @Override
    public List<Group> findAll() {
        return groupJpaRepository.findAll()
                .stream()
                .map(GroupMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<Group> findById(String idGroup) {
        return groupJpaRepository.findById(idGroup)
                .map(GroupMapper::toDomain);
    }
}
