package com.pipre.backend.application.useCases;

import com.pipre.backend.application.dto.ActivityDTO;
import com.pipre.backend.application.dto.ActivityDtoMapper;
import com.pipre.backend.application.ports.input.GetActivitiesUseCase;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.LessonRepositoryPort;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetActivitiesService implements GetActivitiesUseCase {

    private final ActivityRepositoryPort repositoryPort;
    private final LessonRepositoryPort lessonRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public Page<ActivityDTO> execute(String id, Pageable pageable) {
        if (!lessonRepositoryPort.existsById(id)) {
            throw new ResourceNotFoundException("La lección no existe");
        }
        return repositoryPort.findByLessonId(id, pageable)
                .map(ActivityDtoMapper::toDTO);
    }
}
