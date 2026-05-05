package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.ActivityResponseDTO;
import com.pipre.backend.application.ports.input.GetActivitiesUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetActivitiesService implements GetActivitiesUseCase {

    public final ActivityRepositoryPort repositoryPort;

    @Override
    public List<ActivityResponseDTO> execute(String id) {
        return repositoryPort.findAll()
                .stream()
                .map( activity -> new ActivityResponseDTO(
                        activity.getIdActivity(),
                        activity.getName()
                ))
                .toList();
    }
}
