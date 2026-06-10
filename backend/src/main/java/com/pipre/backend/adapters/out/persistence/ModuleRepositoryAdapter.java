package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleJpaEntity;
import com.pipre.backend.adapters.out.persistence.mapper.ModuleMapper;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.CourseJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.ModuleJpaRepository;
import com.pipre.backend.application.ports.output.ModuleRepositoryPort;
import com.pipre.backend.domain.entities.module.Module;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ModuleRepositoryAdapter implements ModuleRepositoryPort {

    private final ModuleJpaRepository moduleJpaRepository;
    private final CourseJpaRepository courseJpaRepository;
    private final ModuleMapper moduleMapper;

    @Override
    public List<Module> findAllByIdCourse(String idCourse) {
        return moduleJpaRepository.findAllByCourseJpaEntity_IdCourse(idCourse)
                .stream()
                .map(moduleMapper::toDomain)
                .toList();
    }

    @Override
    public void save(Module newModule) {
        ModuleJpaEntity entity = moduleMapper.toJpaEntity(newModule);

        if (newModule.getIdCourse() != null) {
           courseJpaRepository.findById(newModule.getIdCourse())
                   .ifPresent(entity::setCourseJpaEntity);
        }

        moduleJpaRepository.save(entity);
    }
}
