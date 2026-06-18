package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.ActivityDTO;
import com.pipre.backend.application.dto.ActivityDtoMapper;
import com.pipre.backend.application.ports.input.GetActivityUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetActivityService implements GetActivityUseCase {

    private final ActivityRepositoryPort repositoryPort;

    @Override
    @Transactional(readOnly = true)
    public ActivityDTO execute(String idActivity) {
        return repositoryPort.findById(idActivity)
                .map(ActivityDtoMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("La actividad no existe"));
    }
}
