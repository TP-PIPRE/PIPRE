package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.mapper.ActivityMapper;
import com.pipre.backend.adapters.out.persistence.repository.ActivityJpaRepository;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.entities.Activity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
@Component
@RequiredArgsConstructor
public class ActivityRepositoryAdapter implements ActivityRepositoryPort {

    private final ActivityJpaRepository jpaRepository;
    @Override
    public List<Activity> findAll() {
        return jpaRepository.findAll()
                .stream()
                .map(ActivityMapper::toDomain)
                .toList();
    }

    @Override
    public Boolean existsByName(String name) {
        return jpaRepository.existsActivityJpaEntityByName(name);
    }

}
