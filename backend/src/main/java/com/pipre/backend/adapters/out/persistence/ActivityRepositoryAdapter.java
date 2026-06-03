package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.adapters.out.persistence.jpaEntities.ActivityJpaEntity;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.ActivityJpaRepository;
import com.pipre.backend.adapters.out.persistence.jpaRepositories.LessonJpaRepository;
import com.pipre.backend.adapters.out.persistence.mapper.ActivityMapper;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.domain.entities.Activity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ActivityRepositoryAdapter implements ActivityRepositoryPort {

    private final ActivityJpaRepository activityJpaRepository;
    private final LessonJpaRepository lessonJpaRepository;

    @Override
    public List<Activity> findAll() {
        return activityJpaRepository.findAll()
                .stream()
                .map(ActivityMapper::toDomain)
                .toList();
    }

    @Override
    public void save(Activity activity) {
        ActivityJpaEntity entity = ActivityMapper.toJpaEntity(activity);
        if (activity.getIdLesson() != null) {
            lessonJpaRepository.findById(activity.getIdLesson())
                    .ifPresent(entity::setLessonJpaEntity);
        }
        activityJpaRepository.save(entity);
    }

    @Override
    public Optional<Activity> findById(String idActivity) {
        return activityJpaRepository.findById(idActivity)
                .map(ActivityMapper::toDomain);
    }

}
