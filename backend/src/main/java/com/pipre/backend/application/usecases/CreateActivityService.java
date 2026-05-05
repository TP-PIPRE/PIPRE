package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.ActivityRequestDTO;
import com.pipre.backend.application.ports.input.CreateActivityUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CreateActivityService implements CreateActivityUseCase {

    private final ActivityRepositoryPort activityRepositoryPort;

    @Override
    public void execute(ActivityRequestDTO requestDTO) {
        if (activityRepositoryPort.existsByName(requestDTO.name())) {
            throw new BusinessException("La actividad ya existe");
        }


    }
}
