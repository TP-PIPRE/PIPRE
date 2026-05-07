package com.pipre.backend.application.useCases;

import com.pipre.backend.application.commands.CreateActivityCommand;
import com.pipre.backend.application.ports.input.CreateActivityUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.entities.Activity;
import com.pipre.backend.domain.factories.ActivityFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CreateActivityService implements CreateActivityUseCase {

    private final ActivityRepositoryPort activityRepositoryPort;

    @Override
    public String execute(CreateActivityCommand cmd) {
        Activity newActivity = ActivityFactory.createNewActivity(
                cmd.name(),
                null,
                null,
                null,
                null,
                cmd.idLesson()
        );
        activityRepositoryPort.save(newActivity);
        return newActivity.getIdActivity();
    }
}
