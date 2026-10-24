package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateActivityCommand;
import com.pipre.backend.application.dto.ActivityDtoMapper;
import com.pipre.backend.application.ports.input.CreateActivityUseCase;
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
public class CreateActivityService implements CreateActivityUseCase {

    private final ActivityRepositoryPort activityRepositoryPort;
    private final LessonRepositoryPort lessonRepositoryPort;

    @Override
    @Transactional
    public String execute(CreateActivityCommand cmd) {
        if (!lessonRepositoryPort.existsById(cmd.idLesson())) {
            throw new ResourceNotFoundException("La lección no existe");
        }

        List<Mission> missions = cmd.missions() != null ? cmd.missions().stream()
                .map(ActivityDtoMapper::toMissionDomain)
                .toList() : new ArrayList<>();

        Double startX = cmd.startingPosition() != null ? cmd.startingPosition().x() : null;
        Double startZ = cmd.startingPosition() != null ? cmd.startingPosition().z() : null;
        Double targetX = cmd.targetPosition() != null ? cmd.targetPosition().x() : null;
        Double targetZ = cmd.targetPosition() != null ? cmd.targetPosition().z() : null;

        Activity newActivity = Activity.builder()
                .idActivity(java.util.UUID.randomUUID().toString())
                .name(cmd.name()).idLesson(cmd.idLesson())
                .logicLevel(ActivityDtoMapper.intToLogicLevel(cmd.logicLevel()))
                .complexity(cmd.complexity()).difficulty(cmd.difficulty()).type(cmd.type())
                .environment(cmd.environment()).description(cmd.description())
                .displayOrder(cmd.displayOrder()).levelTemplate(cmd.levelTemplate())
                .startX(startX).startZ(startZ).targetX(targetX).targetZ(targetZ)
                .missions(missions).build();

        activityRepositoryPort.save(newActivity);
        return newActivity.getIdActivity();
    }
}
