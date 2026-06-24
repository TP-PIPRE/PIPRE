package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.*;
import com.pipre.backend.application.ports.input.GetSimulationsUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.SimulationRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.user.User;
import com.pipre.backend.domain.entities.simulation.Simulation;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetSimulationsService implements GetSimulationsUseCase {

    private final SimulationRepositoryPort simulationRepositoryPort;
    private final UserRepositoryPort userRepositoryPort;
    private final ActivityRepositoryPort activityRepositoryPort;

    @Override
    public List<SimulationDTO> execute(String idStudent) {
        User studentEntity = userRepositoryPort.findById(idStudent)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el estudiante con ID: " + idStudent));

        UserDTO studentDTO = new UserDTO(
                studentEntity.getIdUser(),
                studentEntity.getFirstName(),
                studentEntity.getLastName(),
                studentEntity.getEmail()
        );

        return simulationRepositoryPort.getAllByStudentId(idStudent)
                .stream()
                .map(s -> {
                    Activity activityEntity = activityRepositoryPort.findById(s.getIdActivity())
                            .orElseThrow(() -> new ResourceNotFoundException("No se encontró la actividad con ID: " + s.getIdActivity()));

                    ActivitySummaryDTO activitySummaryDTO = new ActivitySummaryDTO(
                            activityEntity.getIdActivity(),
                            activityEntity.getName()
                    );

                    List<MissionDTO> missionDTOList = activityEntity.getMissions()
                            .stream()
                            .map(m -> new MissionDTO(
                                    m.getId(),
                                    m.getTitle(),
                                    m.getObjective(),
                                    m.getMaxBlocks()
                            ))
                            .toList();

                    PositionDTO startingPosition = new PositionDTO(activityEntity.getStartX(), activityEntity.getStartZ());
                    PositionDTO targetPosition = new PositionDTO(activityEntity.getTargetX(), activityEntity.getTargetZ());

                    return new SimulationDTO(
                            s.getIdSimulation(),
                            studentDTO,
                            activitySummaryDTO,
                            activityEntity.getEnvironment(),
                            missionDTOList,
                            startingPosition,
                            targetPosition,
                            s.getResult().name(),
                            s.getPredictedScore()
                    );
                })
                .toList();
    }
}
