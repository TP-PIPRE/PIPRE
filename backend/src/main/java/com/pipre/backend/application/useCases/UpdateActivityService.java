package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateActivityCommand;
import com.pipre.backend.application.dto.ActivityDtoMapper;
import com.pipre.backend.application.ports.input.UpdateActivityUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.activity.Mission;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UpdateActivityService implements UpdateActivityUseCase {

    private final ActivityRepositoryPort activityRepositoryPort;
    private final LessonRepositoryPort lessonRepositoryPort;

    @Override
    @Transactional
    public void execute(String idActivity, CreateActivityCommand cmd) {
        Activity existing = activityRepositoryPort.findById(idActivity)
                .orElseThrow(() -> new ResourceNotFoundException("La actividad no existe"));

        if (cmd.idLesson() != null && !lessonRepositoryPort.existsById(cmd.idLesson())) {
            throw new ResourceNotFoundException("La lección no existe");
        }

        List<Mission> missions = cmd.missions() != null ? cmd.missions().stream()
                .map(ActivityDtoMapper::toMissionDomain)
                .toList() : new ArrayList<>();

        Double startX = cmd.startingPosition() != null ? cmd.startingPosition().x() : null;
        Double startZ = cmd.startingPosition() != null ? cmd.startingPosition().z() : null;
        Double targetX = cmd.targetPosition() != null ? cmd.targetPosition().x() : null;
        Double targetZ = cmd.targetPosition() != null ? cmd.targetPosition().z() : null;

        Activity updatedActivity = Activity.builder()
                .idActivity(existing.getIdActivity())
                .name(cmd.name() != null ? cmd.name() : existing.getName())
                .idLesson(cmd.idLesson() != null ? cmd.idLesson() : existing.getIdLesson())
                .logicLevel(cmd.logicLevel() != null ? ActivityDtoMapper.intToLogicLevel(cmd.logicLevel()) : existing.getLogicLevel())
                .complexity(cmd.complexity() != null ? cmd.complexity() : existing.getComplexity())
                .difficulty(cmd.difficulty() != null ? cmd.difficulty() : existing.getDifficulty())
                .type(cmd.type() != null ? cmd.type() : existing.getType())
                .environment(cmd.environment() != null ? cmd.environment() : existing.getEnvironment())
                .startX(startX != null ? startX : existing.getStartX())
                .startZ(startZ != null ? startZ : existing.getStartZ())
                .targetX(targetX != null ? targetX : existing.getTargetX())
                .targetZ(targetZ != null ? targetZ : existing.getTargetZ())
                .missions(missions)
                .idSimulationList(existing.getIdSimulationList())
                .build();

        activityRepositoryPort.save(updatedActivity);
    }
}
