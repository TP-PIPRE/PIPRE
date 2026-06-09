package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.ActivityDTO;
import com.pipre.backend.application.ports.input.GetActivitiesUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GetActivitiesService implements GetActivitiesUseCase {

    private final ActivityRepositoryPort repositoryPort;
    private final LessonRepositoryPort lessonRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public List<ActivityDTO> execute(String id) {
        if (!lessonRepositoryPort.existsById(id)) {
            throw new ResourceNotFoundException("La lección no existe");
        }
        return repositoryPort.findByLessonId(id)
                .stream()
                .map( activity -> new ActivityDTO(
                        activity.getIdActivity(),
                        activity.getName()
                ))
                .toList();
    }
}
