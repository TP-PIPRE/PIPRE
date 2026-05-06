package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.mapper.GroupMapper;
import com.pipre.backend.adapters.out.persistence.repository.GroupJpaRepository;
import com.pipre.backend.application.ports.output.GroupRepositoryPort;
import com.pipre.backend.domain.entities.Group;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

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
}
