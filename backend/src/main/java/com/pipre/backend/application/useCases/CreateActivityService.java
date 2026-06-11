package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateActivityCommand;
import com.pipre.backend.application.ports.input.CreateActivityUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import com.pipre.backend.domain.factories.ActivityFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CreateActivityService implements CreateActivityUseCase {

    private final ActivityRepositoryPort activityRepositoryPort;
    private final LessonRepositoryPort lessonRepositoryPort;

    @Override
    public String execute(CreateActivityCommand cmd) {
        if (!lessonRepositoryPort.existsById(cmd.idLesson())) {
            throw new ResourceNotFoundException("La lección no existe");
        }
        Activity newActivity = ActivityFactory.createNewActivity(
                cmd.name(),
                cmd.idLesson());
        activityRepositoryPort.save(newActivity);
        return newActivity.getIdActivity();
    }
}
