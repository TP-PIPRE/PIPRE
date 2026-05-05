package com.pipre.backend.application.usecases;

import com.pipre.backend.adapters.in.web.dto.ActivityRequestDTO;
import com.pipre.backend.adapters.in.web.dto.ActivityResponseDTO;
import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaEntities.LessonJpaEntity;
import com.pipre.backend.adapters.out.persistence.repository.LessonJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

//@Service
//@RequiredArgsConstructor
public class ActivityService {
//    private final LessonJpaRepository lessonJpaRepository;
//
//    @Transactional(readOnly = true)
//    public List<ActivityResponseDTO> getActivities(UUID idLesson) {
//        LessonJpaEntity lessonJpaEntity = lessonJpaRepository.findById(idLesson)
//                .orElseThrow(() -> new RuntimeException("Módulo no encontrado"));
//
//        return lessonJpaEntity.getActivitiesJpas().stream()
//                .map( lesson -> new ActivityResponseDTO(
//                        lesson.getIdActivity(),
//                        lesson.getName()
//                ))
//                .toList();
//    }
//
//    @Transactional
//    public void postActivity(ActivityRequestDTO requestDTO) {
//
//        LessonJpaEntity lessonJpaEntity = lessonJpaRepository.findById(requestDTO.idLesson())
//                .orElseThrow(() -> new RuntimeException("Módulo no encontrado"));
//
//        ActivityJpaEntity activityJpaEntity = ActivityJpaEntity.builder()
//                .name(requestDTO.name())
//                .build();
//
//        lessonJpaEntity.addActivity(activityJpaEntity);
//
//        lessonJpaRepository.save(lessonJpaEntity);
//    }
}
