package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.controller.dto.ActivityRequestDTO;
import com.pipre.backend.adapters.in.controller.dto.ActivityResponseDTO;
import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpa;
import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpa;
import com.pipre.backend.adapters.out.persistence.repository.LessonRepository;
import com.pipre.backend.adapters.out.persistence.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityService {
    private final LessonRepository lessonRepository;

    @Transactional(readOnly = true)
    public List<ActivityResponseDTO> getActivities(UUID idLesson) {
        LessonJpa lessonJpa = lessonRepository.findById(idLesson)
                .orElseThrow(() -> new RuntimeException("Módulo no encontrado"));

        return lessonJpa.getActivitiesJpas().stream()
                .map( lesson -> new ActivityResponseDTO(
                        lesson.getIdActivity(),
                        lesson.getName()
                ))
                .toList();
    }

    @Transactional
    public void postActivity(ActivityRequestDTO requestDTO) {

        LessonJpa lessonJpa = lessonRepository.findById(requestDTO.idLesson())
                .orElseThrow(() -> new RuntimeException("Módulo no encontrado"));

        ActivityJpa activityJpa = ActivityJpa.builder()
                .name(requestDTO.name())
                .build();

        lessonJpa.addActivity(activityJpa);

        lessonRepository.save(lessonJpa);
    }
}
