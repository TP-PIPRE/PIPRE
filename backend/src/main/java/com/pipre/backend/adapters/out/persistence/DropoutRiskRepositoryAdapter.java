package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.DropoutRiskJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.DropoutRiskJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.UserJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.DropoutRiskMapper;
import com.pipre.backend.application.ports.output.DropoutRiskRepositoryPort;
import com.pipre.backend.domain.entities.dropoutrisk.DropoutRisk;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DropoutRiskRepositoryAdapter implements DropoutRiskRepositoryPort {
    private final DropoutRiskJpaRepository dropoutRiskJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final DropoutRiskMapper dropoutRiskMapper;

    @Override
    public Optional<DropoutRisk> findByIdStudent(String idStudent) {
        return dropoutRiskJpaRepository.findByStudentJpaEntityIdUser(idStudent)
                .map(dropoutRiskMapper::toDomain);
    }

    @Override
    public void save(DropoutRisk dropoutRisk) {
        DropoutRiskJpaEntity entity = dropoutRiskMapper.toJpaEntity(dropoutRisk);
        
        if (dropoutRisk.getIdStudent() != null) {
            userJpaRepository.findById(dropoutRisk.getIdStudent())
                    .ifPresent(entity::setStudentJpaEntity);
        }
        
        dropoutRiskJpaRepository.save(entity);
    }
}
