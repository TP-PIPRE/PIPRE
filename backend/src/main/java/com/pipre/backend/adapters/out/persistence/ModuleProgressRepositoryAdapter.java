package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ModuleProgressJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.ModuleProgressJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.UserJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.ModuleJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.ModuleProgressMapper;
import com.pipre.backend.application.ports.output.ModuleProgressRepositoryPort;
import com.pipre.backend.domain.entities.moduleprogress.ModuleProgress;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ModuleProgressRepositoryAdapter implements ModuleProgressRepositoryPort {
    private final ModuleProgressJpaRepository moduleProgressJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final ModuleJpaRepository moduleJpaRepository;
    private final ModuleProgressMapper moduleProgressMapper;

    @Override
    public Optional<ModuleProgress> findById(String idProgress) {
        return moduleProgressJpaRepository.findById(idProgress)
                .map(moduleProgressMapper::toDomain);
    }

    @Override
    public Optional<ModuleProgress> findByStudentAndModule(String idStudent, String idModule) {
        return moduleProgressJpaRepository.findByStudentJpaEntityIdUserAndModuleJpaEntityIdModule(idStudent, idModule)
                .map(moduleProgressMapper::toDomain);
    }

    @Override
    public List<ModuleProgress> findAllByIdStudent(String idStudent) {
        return moduleProgressJpaRepository.findAllByStudentJpaEntityIdUser(idStudent)
                .stream()
                .map(moduleProgressMapper::toDomain)
                .toList();
    }

    @Override
    public void save(ModuleProgress moduleProgress) {
        ModuleProgressJpaEntity entity = moduleProgressMapper.toJpaEntity(moduleProgress);
        
        if (moduleProgress.getIdStudent() != null) {
            userJpaRepository.findById(moduleProgress.getIdStudent())
                    .ifPresent(entity::setStudentJpaEntity);
        }
        
        if (moduleProgress.getIdModule() != null) {
            moduleJpaRepository.findById(moduleProgress.getIdModule())
                    .ifPresent(entity::setModuleJpaEntity);
        }
        
        moduleProgressJpaRepository.save(entity);
    }
}
