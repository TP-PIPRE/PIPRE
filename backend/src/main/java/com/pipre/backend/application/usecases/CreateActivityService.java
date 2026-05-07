package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.ActivityRequestDTO;
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
    public void execute(ActivityRequestDTO requestDTO) {
        Activity newActivity = ActivityFactory.createNewActivity(
                requestDTO.name(),
                null,
                null,
                null,
                null,
                requestDTO.idLesson()
        );
        activityRepositoryPort.save(newActivity);
    }
}
