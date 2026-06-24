package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateActivityCommand;
import com.pipre.backend.application.dto.ActivityDtoMapper;
import com.pipre.backend.application.ports.input.CreateActivityUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.activity.Mission;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import com.pipre.backend.domain.factories.ActivityFactory;
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

        Activity newActivity = ActivityFactory.createNewActivity(
                cmd.name(),
                cmd.idLesson(),
                ActivityDtoMapper.intToLogicLevel(cmd.logicLevel()),
                cmd.complexity(),
                cmd.difficulty(),
                cmd.type(),
                cmd.environment(),
                startX,
                startZ,
                targetX,
                targetZ,
                missions
        );

        activityRepositoryPort.save(newActivity);
        return newActivity.getIdActivity();
    }
}
