package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.SimulationJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.SimulationJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.SimulationMapper;
import com.pipre.backend.application.ports.output.SimulationRepositoryPort;
import com.pipre.backend.domain.entities.Simulation;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class SimulationRepositoryAdapter implements SimulationRepositoryPort {
    private final SimulationJpaRepository simulationJpaRepository;

    @Override
    public List<Simulation> getAllByStudentId(String idStudent) {
        return simulationJpaRepository.findAllByStudentJpaEntityIdUser(idStudent)
                .stream()
                .map(SimulationMapper::toDomain)
                .toList();
    }

    @Override
    public void save(Simulation simulation) {
        SimulationJpaEntity entity = SimulationMapper.toJpaEntity(simulation);
        simulationJpaRepository.save(entity);
    }
}
