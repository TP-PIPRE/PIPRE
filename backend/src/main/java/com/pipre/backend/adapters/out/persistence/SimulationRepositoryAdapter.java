package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.SimulationJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.SimulationJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.SimulationMapper;
import com.pipre.backend.application.ports.output.SimulationRepositoryPort;
import com.pipre.backend.domain.entities.simulation.Simulation;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class SimulationRepositoryAdapter implements SimulationRepositoryPort {
    private final SimulationJpaRepository simulationJpaRepository;
    private final SimulationMapper simulationMapper;
    private final com.pipre.backend.adapters.out.persistence.jpaRepositories.UserJpaRepository users;
    private final com.pipre.backend.adapters.out.persistence.jpaRepositories.ActivityJpaRepository activities;

    @Override
    public List<Simulation> getAllByStudentId(String idStudent) {
        return simulationJpaRepository.findAllByStudentJpaEntityIdUser(idStudent)
                .stream()
                .map(simulationMapper::toDomain)
                .toList();
    }

    @Override
    public void save(Simulation simulation) {
        SimulationJpaEntity entity = simulationMapper.toJpaEntity(simulation);
        entity.setStudentJpaEntity(users.findById(simulation.getIdStudent()).orElseThrow(()->new com.pipre.backend.domain.exceptions.ResourceNotFoundException("El estudiante no existe.")));
        entity.setActivityJpaEntity(activities.findById(simulation.getIdActivity()).orElseThrow(()->new com.pipre.backend.domain.exceptions.ResourceNotFoundException("La actividad no existe.")));
        simulationJpaRepository.save(entity);
    }
}
