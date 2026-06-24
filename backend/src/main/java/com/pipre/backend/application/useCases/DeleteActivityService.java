package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.input.DeleteActivityUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeleteActivityService implements DeleteActivityUseCase {

    private final ActivityRepositoryPort activityRepositoryPort;

    @Override
    @Transactional
    public void execute(String idActivity) {
        activityRepositoryPort.findById(idActivity)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la actividad con ID: " + idActivity));
        activityRepositoryPort.deleteById(idActivity);
    }
}
